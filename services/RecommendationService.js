import { User, Recommendation, TrendingTopic, UserRecommendation, sequelize } from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';
import logger from '../utils/logger.js';

class RecommendationService {
  
  /**
   * Get personalized recommendations for a user based on their standard and trending topics
   */
  static async getPersonalizedRecommendations(userId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        category = null,
        contentType = null,
        difficultyLevel = null
      } = options;

      // Get user details
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Build where conditions
      const whereConditions = {
        is_active: true,
        target_standards: {
          [Op.contains]: [user.student_standard || 10] // Default to class 10 if not set
        }
      };

      if (category) {
        whereConditions.category = category;
      }

      if (contentType) {
        whereConditions.content_type = contentType;
      }

      if (difficultyLevel) {
        whereConditions.difficulty_level = difficultyLevel;
      }

      // Get recommendations with user interaction data
      const recommendations = await Recommendation.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: UserRecommendation,
            where: { user_id: userId },
            required: false,
            attributes: ['interaction_type', 'rating', 'recommended_at', 'interacted_at']
          }
        ],
        order: [
          ['trending_score', 'DESC'],
          ['rating', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });

      // Calculate personalization score and filter out dismissed content
      const personalizedRecommendations = recommendations.rows
        .filter(rec => {
          // Filter out dismissed recommendations
          const userInteraction = rec.UserRecommendations?.[0];
          return !userInteraction || userInteraction.interaction_type !== 'dismissed';
        })
        .map(rec => {
          const userInteraction = rec.UserRecommendations?.[0];
          let personalizationScore = parseFloat(rec.trending_score);
          
          // Boost score based on user interactions
          if (userInteraction) {
            switch (userInteraction.interaction_type) {
              case 'liked':
              case 'saved':
                personalizationScore += 10;
                break;
              case 'completed':
                personalizationScore += 15;
                break;
              case 'viewed':
                personalizationScore += 2;
                break;
            }
          }

          return {
            ...rec.toJSON(),
            personalization_score: personalizationScore,
            user_interaction: userInteraction || null
          };
        })
        .sort((a, b) => b.personalization_score - a.personalization_score);

      return {
        total: recommendations.count,
        recommendations: personalizedRecommendations
      };
    } catch (error) {
      logger.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Get trending topics relevant to user's standard
   */
  static async getTrendingTopics(userId, options = {}) {
    try {
      const { limit = 10, category = null } = options;

      // Get user details
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const whereConditions = {
        is_active: true,
        target_standards: {
          [Op.contains]: [user.student_standard || 10]
        }
      };

      if (category) {
        whereConditions.category = category;
      }

      const trendingTopics = await TrendingTopic.findAll({
        where: whereConditions,
        order: [
          ['trending_score', 'DESC'],
          ['job_market_demand', 'DESC']
        ],
        limit: parseInt(limit)
      });

      return trendingTopics;
    } catch (error) {
      logger.error('Error getting trending topics:', error);
      throw error;
    }
  }

  /**
   * Get recommendations by category
   */
  static async getRecommendationsByCategory(userId, category, options = {}) {
    try {
      const { limit = 15, offset = 0 } = options;

      return await this.getPersonalizedRecommendations(userId, {
        ...options,
        category,
        limit,
        offset
      });
    } catch (error) {
      logger.error('Error getting recommendations by category:', error);
      throw error;
    }
  }

  /**
   * Record user interaction with a recommendation
   */
  static async recordInteraction(userId, recommendationId, interactionType, metadata = {}) {
    try {
      const { rating, timeSpentMinutes, completionPercentage, feedback } = metadata;

      // Check if interaction already exists
      const existingInteraction = await UserRecommendation.findOne({
        where: {
          user_id: userId,
          recommendation_id: recommendationId,
          interaction_type: interactionType
        }
      });

      if (existingInteraction) {
        // Update existing interaction
        await existingInteraction.update({
          rating: rating || existingInteraction.rating,
          time_spent_minutes: timeSpentMinutes || existingInteraction.time_spent_minutes,
          completion_percentage: completionPercentage || existingInteraction.completion_percentage,
          feedback: feedback || existingInteraction.feedback,
          interacted_at: new Date()
        });
        return existingInteraction;
      } else {
        // Create new interaction
        const interaction = await UserRecommendation.create({
          user_id: userId,
          recommendation_id: recommendationId,
          interaction_type: interactionType,
          rating,
          time_spent_minutes: timeSpentMinutes,
          completion_percentage: completionPercentage,
          feedback,
          interacted_at: new Date()
        });
        return interaction;
      }
    } catch (error) {
      logger.error('Error recording user interaction:', error);
      throw error;
    }
  }

  /**
   * Get user's interaction history
   */
  static async getUserInteractionHistory(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, interactionType = null } = options;

      const whereConditions = { user_id: userId };
      if (interactionType) {
        whereConditions.interaction_type = interactionType;
      }

      const interactions = await UserRecommendation.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Recommendation,
            attributes: ['title', 'content_type', 'category', 'url', 'thumbnail_url']
          }
        ],
        order: [['interacted_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return interactions;
    } catch (error) {
      logger.error('Error getting user interaction history:', error);
      throw error;
    }
  }

  /**
   * Get recommendations for a specific trending topic
   */
  static async getRecommendationsForTopic(userId, topicId, options = {}) {
    try {
      const { limit = 10 } = options;

      // Get the trending topic
      const topic = await TrendingTopic.findByPk(topicId);
      if (!topic) {
        throw new Error('Trending topic not found');
      }

      // Get user details
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Find recommendations related to this topic
      const recommendations = await Recommendation.findAll({
        where: {
          is_active: true,
          category: topic.category,
          target_standards: {
            [Op.contains]: [user.student_standard || 10]
          },
          [Op.or]: [
            {
              tags: {
                [Op.contains]: [topic.topic_name.toLowerCase()]
              }
            },
            {
              title: {
                [Op.iLike]: `%${topic.topic_name}%`
              }
            },
            {
              description: {
                [Op.iLike]: `%${topic.topic_name}%`
              }
            }
          ]
        },
        order: [
          ['trending_score', 'DESC'],
          ['rating', 'DESC']
        ],
        limit: parseInt(limit)
      });

      return {
        topic,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting recommendations for topic:', error);
      throw error;
    }
  }

  /**
   * Get career-focused recommendations based on user's interests
   */
  static async getCareerRecommendations(userId, options = {}) {
    try {
      const { limit = 15 } = options;

      // Get user details
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get high-demand career topics for user's standard
      const careerTopics = await TrendingTopic.findAll({
        where: {
          is_active: true,
          target_standards: {
            [Op.contains]: [user.student_standard || 10]
          },
          job_market_demand: {
            [Op.in]: ['very_high', 'high']
          }
        },
        order: [['trending_score', 'DESC']],
        limit: 5
      });

      // Get recommendations for these career topics
      const careerCategories = careerTopics.map(topic => topic.category);
      
      const recommendations = await Recommendation.findAll({
        where: {
          is_active: true,
          target_standards: {
            [Op.contains]: [user.student_standard || 10]
          },
          category: {
            [Op.in]: careerCategories
          },
          tags: {
            [Op.contains]: ['career', 'job', 'skills', 'future']
          }
        },
        order: [
          ['trending_score', 'DESC'],
          ['rating', 'DESC']
        ],
        limit: parseInt(limit)
      });

      return {
        career_topics: careerTopics,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting career recommendations:', error);
      throw error;
    }
  }

  /**
   * Search recommendations by query
   */
  static async searchRecommendations(userId, query, options = {}) {
    try {
      const { limit = 20, offset = 0, category = null } = options;

      // Get user details
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const whereConditions = {
        is_active: true,
        target_standards: {
          [Op.contains]: [user.student_standard || 10]
        },
        [Op.or]: [
          {
            title: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            description: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            tags: {
              [Op.contains]: [query.toLowerCase()]
            }
          }
        ]
      };

      if (category) {
        whereConditions.category = category;
      }

      const recommendations = await Recommendation.findAndCountAll({
        where: whereConditions,
        order: [
          ['trending_score', 'DESC'],
          ['rating', 'DESC']
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return recommendations;
    } catch (error) {
      logger.error('Error searching recommendations:', error);
      throw error;
    }
  }

  /**
   * Get recommendation statistics for admin/analytics
   */
  static async getRecommendationStats() {
    try {
      const stats = await Promise.all([
        // Total recommendations
        Recommendation.count({ where: { is_active: true } }),
        
        // Total trending topics
        TrendingTopic.count({ where: { is_active: true } }),
        
        // Total user interactions
        UserRecommendation.count(),
        
        // Most popular categories
        Recommendation.findAll({
          attributes: [
            'category',
            [fn('COUNT', col('id')), 'count']
          ],
          where: { is_active: true },
          group: ['category'],
          order: [[literal('count'), 'DESC']],
          limit: 10
        }),
        
        // Most interacted recommendations
        UserRecommendation.findAll({
          attributes: [
            'recommendation_id',
            [fn('COUNT', col('id')), 'interaction_count']
          ],
          include: [
            {
              model: Recommendation,
              attributes: ['title', 'category', 'content_type']
            }
          ],
          group: ['recommendation_id', 'Recommendation.id'],
          order: [[literal('interaction_count'), 'DESC']],
          limit: 10
        })
      ]);

      return {
        total_recommendations: stats[0],
        total_trending_topics: stats[1],
        total_interactions: stats[2],
        popular_categories: stats[3],
        most_interacted: stats[4]
      };
    } catch (error) {
      logger.error('Error getting recommendation stats:', error);
      throw error;
    }
  }
}

export default RecommendationService;

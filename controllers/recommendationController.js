import { User, Recommendation, TrendingTopic, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

// Helper function to get userId from request (for authenticated endpoints)
const getUserId = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
};

/**
 * Populate recommendations for a specific student standard
 * Called by frontend with student_standard in body
 * NO AUTHENTICATION REQUIRED - Frontend calls this directly
 */
export const populateRecommendations = async (req, res, next) => {
  try {
    const { student_standard } = req.body;
    
    // Validate student_standard
    if (!student_standard || student_standard < 9 || student_standard > 12) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid student_standard (9-12) is required'
      });
    }

    logger.info(`Populating recommendations for Class ${student_standard}`);
    
    // Check if we already have sufficient content for this standard using raw SQL
    const [recResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM recommendations WHERE target_standards @> '[${student_standard}]' AND is_active = true`
    );
    const existingRecommendations = parseInt(recResult[0].count);

    const [topicResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM trending_topics WHERE target_standards @> '[${student_standard}]' AND is_active = true`
    );
    const existingTopics = parseInt(topicResult[0].count);

    if (existingRecommendations >= 10 && existingTopics >= 3) {
      logger.info(`Sufficient content already exists for Class ${student_standard}`);
      return res.status(200).json({
        status: 'success',
        message: `Sufficient recommendations already exist for Class ${student_standard}`,
        data: {
          student_standard: student_standard,
          existing_recommendations: existingRecommendations,
          existing_topics: existingTopics,
          new_content_added: 0
        }
      });
    }

    // Get categories and generate content based on student standard
    const categories = getCategoriesForStandard(student_standard);
    const recommendationsData = generateRecommendationsForStandard(student_standard, categories);
    const topicsData = generateTrendingTopicsForStandard(student_standard, categories);
    
    // Save to database using raw SQL to match actual schema
    let recommendationsSaved = 0;
    let topicsSaved = 0;

    if (recommendationsData.length > 0) {
      for (const rec of recommendationsData) {
        try {
          await sequelize.query(`
            INSERT INTO recommendations (
              id, title, description, content_type, url, category, 
              target_standards, difficulty_level, source, trending_score, is_active
            ) VALUES (
              gen_random_uuid(), 
              :title, 
              :description, 
              :content_type, 
              :url, 
              :category, 
              :target_standards::jsonb, 
              :difficulty_level, 
              :source, 
              :trending_score, 
              :is_active
            ) ON CONFLICT DO NOTHING
          `, {
            replacements: {
              title: rec.title,
              description: rec.description,
              content_type: rec.content_type,
              url: rec.url,
              category: rec.category,
              target_standards: JSON.stringify(rec.target_standards),
              difficulty_level: rec.difficulty_level,
              source: rec.source || 'Unknown',
              trending_score: rec.trending_score,
              is_active: rec.is_active
            }
          });
          recommendationsSaved++;
        } catch (error) {
          logger.error('Error inserting recommendation:', error);
        }
      }
    }

    if (topicsData.length > 0) {
      for (const topic of topicsData) {
        try {
          await sequelize.query(`
            INSERT INTO trending_topics (
              id, topic_name, description, category, target_standards, 
              job_market_demand, salary_range, trending_score, is_active
            ) VALUES (
              gen_random_uuid(), 
              :topic_name, 
              :description, 
              :category, 
              :target_standards::jsonb, 
              :job_market_demand, 
              :salary_range, 
              :trending_score, 
              :is_active
            ) ON CONFLICT DO NOTHING
          `, {
            replacements: {
              topic_name: topic.topic_name,
              description: topic.description,
              category: topic.category,
              target_standards: JSON.stringify(topic.target_standards),
              job_market_demand: topic.job_market_demand,
              salary_range: topic.salary_range,
              trending_score: topic.trending_score,
              is_active: topic.is_active
            }
          });
          topicsSaved++;
        } catch (error) {
          logger.error('Error inserting trending topic:', error);
        }
      }
    }

    logger.info(`Population completed for Class ${student_standard}: ${recommendationsSaved} recommendations, ${topicsSaved} topics`);
    
    res.status(200).json({
      status: 'success',
      message: `Recommendations populated for Class ${student_standard}`,
      data: {
        student_standard: student_standard,
        categories_processed: categories,
        recommendations_added: recommendationsSaved,
        trending_topics_added: topicsSaved,
        total_content_added: recommendationsSaved + topicsSaved,
        existing_recommendations: existingRecommendations,
        existing_topics: existingTopics
      }
    });

  } catch (error) {
    logger.error('Population API error:', error);
    next(error);
  }
};

/**
 * Get recommendations for current user (requires authentication)
 * Called when user logs in to get their personalized content
 */
export const getUserRecommendations = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { limit = 10, category } = req.query;
    
    // Get user details
    const user = await User.findByPk(userId);
    if (!user || !user.student_standard) {
      return res.status(400).json({
        status: 'error',
        message: 'User not found or student_standard not set'
      });
    }

    // Build query using raw SQL for JSONB array matching
    let recQuery = `SELECT * FROM recommendations WHERE target_standards @> '[${user.student_standard}]' AND is_active = true`;
    if (category) {
      recQuery += ` AND category = '${category}'`;
    }
    recQuery += ` ORDER BY trending_score DESC, created_at DESC LIMIT ${parseInt(limit)}`;
    
    const recommendations = await sequelize.query(recQuery, {
      type: sequelize.QueryTypes.SELECT
    });

    // Get trending topics for this user
    const trendingTopics = await sequelize.query(
      `SELECT * FROM trending_topics WHERE target_standards @> '[${user.student_standard}]' AND is_active = true ORDER BY trending_score DESC LIMIT 5`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user_profile: {
          student_standard: user.student_standard,
          username: user.username
        },
        recommendations: recommendations,
        trending_topics: trendingTopics,
        total_recommendations: recommendations.length,
        total_trending_topics: trendingTopics.length,
        filters_applied: {
          category: category || 'all',
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get user recommendations error:', error);
    next(error);
  }
};

// Helper functions

function getCategoriesForStandard(standard) {
  const categoryMapping = {
    9: ['programming', 'science'],
    10: ['programming', 'science', 'career', 'digital_marketing'],
    11: ['ai_ml', 'programming', 'data_science', 'technology'],
    12: ['ai_ml', 'data_science', 'technology', 'career', 'entrepreneurship']
  };
  return categoryMapping[standard] || ['programming', 'career'];
}

function generateRecommendationsForStandard(studentStandard, categories) {
  const recommendations = [];
  
  const contentTemplates = {
    programming: [
      {
        title: `Python Programming for Class ${studentStandard}`,
        description: 'Learn Python programming with practical examples',
        content_type: 'course',
        url: 'https://example.com/python-course',
        category: 'programming',
        difficulty_level: studentStandard >= 11 ? 'intermediate' : 'beginner',
        source: 'YouTube',
        trending_score: 85.0
      },
      {
        title: `Web Development Basics`,
        description: 'Introduction to HTML, CSS, and JavaScript',
        content_type: 'video',
        url: 'https://youtube.com/watch?v=webdev',
        category: 'programming',
        difficulty_level: 'beginner',
        source: 'YouTube',
        trending_score: 80.0
      }
    ],
    ai_ml: [
      {
        title: `Introduction to Artificial Intelligence`,
        description: 'Understanding AI concepts and applications',
        content_type: 'course',
        url: 'https://example.com/ai-intro',
        category: 'ai_ml',
        difficulty_level: 'intermediate',
        source: 'Coursera',
        trending_score: 95.0
      },
      {
        title: `Machine Learning Career Guide`,
        description: 'ML job market and opportunities in India',
        content_type: 'article',
        url: 'https://example.com/ml-careers',
        category: 'ai_ml',
        difficulty_level: 'beginner',
        source: 'TechCrunch',
        trending_score: 90.0
      }
    ],
    data_science: [
      {
        title: `Data Science Fundamentals`,
        description: 'Learn data analysis and visualization',
        content_type: 'course',
        url: 'https://example.com/data-science',
        category: 'data_science',
        difficulty_level: 'intermediate',
        source: 'Coursera',
        trending_score: 88.0
      }
    ],
    digital_marketing: [
      {
        title: `Digital Marketing for Beginners`,
        description: 'Learn SEO, social media marketing',
        content_type: 'course',
        url: 'https://example.com/digital-marketing',
        category: 'digital_marketing',
        difficulty_level: 'beginner',
        source: 'Unacademy',
        trending_score: 75.0
      }
    ],
    science: [
      {
        title: `Physics Concepts for Class ${studentStandard}`,
        description: 'Understanding fundamental physics principles',
        content_type: 'video',
        url: 'https://youtube.com/watch?v=physics',
        category: 'science',
        difficulty_level: studentStandard >= 11 ? 'intermediate' : 'beginner',
        source: 'YouTube',
        trending_score: 70.0
      }
    ],
    career: [
      {
        title: `Career Options After Class ${studentStandard}`,
        description: 'Explore various career paths',
        content_type: 'article',
        url: 'https://example.com/career-options',
        category: 'career',
        difficulty_level: 'beginner',
        source: 'Career360',
        trending_score: 82.0
      }
    ]
  };

  categories.forEach(category => {
    const templates = contentTemplates[category] || [];
    templates.forEach(template => {
      recommendations.push({
        ...template,
        target_standards: [studentStandard],
        is_active: true
      });
    });
  });

  return recommendations;
}

function generateTrendingTopicsForStandard(studentStandard, categories) {
  const topics = [];
  
  const topicTemplates = {
    programming: {
      topic_name: 'Software Development & Programming',
      description: 'Programming skills in high demand across industries',
      job_market_demand: 'very_high',
      salary_range: '4-20 LPA',
      trending_score: 85.0
    },
    ai_ml: {
      topic_name: 'Artificial Intelligence & Machine Learning',
      description: 'AI/ML transforming industries with massive opportunities',
      job_market_demand: 'very_high',
      salary_range: '6-30 LPA',
      trending_score: 95.0
    },
    data_science: {
      topic_name: 'Data Science & Analytics',
      description: 'Data-driven decision making creating huge demand',
      job_market_demand: 'very_high',
      salary_range: '5-25 LPA',
      trending_score: 90.0
    },
    digital_marketing: {
      topic_name: 'Digital Marketing',
      description: 'Digital transformation driving marketing demand',
      job_market_demand: 'high',
      salary_range: '3-15 LPA',
      trending_score: 80.0
    },
    science: {
      topic_name: 'STEM & Research',
      description: 'Science and technology research opportunities',
      job_market_demand: 'high',
      salary_range: '4-18 LPA',
      trending_score: 75.0
    },
    career: {
      topic_name: 'Emerging Career Opportunities',
      description: 'New age careers in technology and digital sectors',
      job_market_demand: 'high',
      salary_range: '3-20 LPA',
      trending_score: 82.0
    }
  };

  categories.forEach(category => {
    if (topicTemplates[category]) {
      const template = topicTemplates[category];
      topics.push({
        topic_name: template.topic_name,
        description: template.description,
        category: category,
        target_standards: [studentStandard],
        job_market_demand: template.job_market_demand,
        salary_range: template.salary_range,
        trending_score: template.trending_score,
        is_active: true
      });
    }
  });

  return topics;
}
#!/usr/bin/env node

import { sequelize } from '../models/index.js';
import logger from '../utils/logger.js';

async function createRecommendationTablesOnly() {
  try {
    console.log('🔧 Creating recommendation tables only...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Create tables manually with raw SQL
    const createTablesSQL = `
      -- Create recommendations table
      CREATE TABLE IF NOT EXISTS recommendations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'article', 'course', 'tutorial', 'blog')),
          url VARCHAR(500) NOT NULL,
          thumbnail_url VARCHAR(500),
          category VARCHAR(100) NOT NULL,
          subcategory VARCHAR(100),
          target_standards JSONB NOT NULL DEFAULT '[]',
          difficulty_level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
          duration_minutes INTEGER CHECK (duration_minutes > 0),
          language VARCHAR(50) NOT NULL DEFAULT 'english',
          source VARCHAR(100) NOT NULL,
          author VARCHAR(100),
          rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
          view_count INTEGER DEFAULT 0,
          tags JSONB DEFAULT '[]',
          trending_score DECIMAL(5,2) NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          published_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create trending_topics table
      CREATE TABLE IF NOT EXISTS trending_topics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          topic_name VARCHAR(200) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL CHECK (category IN (
              'technology', 'science', 'mathematics', 'engineering', 'medicine', 
              'business', 'finance', 'arts', 'literature', 'history', 'geography',
              'environment', 'sports', 'career', 'skills', 'programming', 'ai_ml',
              'data_science', 'digital_marketing', 'entrepreneurship', 'government_exams',
              'competitive_exams', 'languages', 'personal_development'
          )),
          target_age_groups JSONB NOT NULL DEFAULT '[]',
          target_standards JSONB NOT NULL DEFAULT '[]',
          relevance_in_india TEXT,
          future_prospects TEXT,
          trending_score DECIMAL(5,2) NOT NULL DEFAULT 0,
          growth_rate DECIMAL(5,2),
          job_market_demand VARCHAR(20) NOT NULL DEFAULT 'moderate' CHECK (job_market_demand IN ('very_high', 'high', 'moderate', 'low')),
          salary_range VARCHAR(100),
          skills_required JSONB DEFAULT '[]',
          related_careers JSONB DEFAULT '[]',
          learning_path JSONB DEFAULT '[]',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create user_recommendations table (for tracking user interactions)
      CREATE TABLE IF NOT EXISTS user_recommendations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
          interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('viewed', 'clicked', 'liked', 'saved', 'completed', 'dismissed')),
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          time_spent_minutes INTEGER CHECK (time_spent_minutes >= 0),
          completion_percentage DECIMAL(5,2) CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
          feedback TEXT,
          recommended_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          interacted_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, recommendation_id, interaction_type)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
      CREATE INDEX IF NOT EXISTS idx_recommendations_target_standards ON recommendations USING GIN(target_standards);
      CREATE INDEX IF NOT EXISTS idx_recommendations_trending_score ON recommendations(trending_score);
      CREATE INDEX IF NOT EXISTS idx_recommendations_is_active ON recommendations(is_active);
      CREATE INDEX IF NOT EXISTS idx_recommendations_tags ON recommendations USING GIN(tags);

      CREATE INDEX IF NOT EXISTS idx_trending_topics_category ON trending_topics(category);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_target_standards ON trending_topics USING GIN(target_standards);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_trending_score ON trending_topics(trending_score);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_job_market_demand ON trending_topics(job_market_demand);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_is_active ON trending_topics(is_active);

      CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_recommendations_recommendation_id ON user_recommendations(recommendation_id);
      CREATE INDEX IF NOT EXISTS idx_user_recommendations_interaction_type ON user_recommendations(interaction_type);
      CREATE INDEX IF NOT EXISTS idx_user_recommendations_recommended_at ON user_recommendations(recommended_at);
    `;
    
    // Execute the SQL
    await sequelize.query(createTablesSQL);
    console.log('✅ Recommendation tables created successfully');
    
    // Check table counts
    const [recResult] = await sequelize.query('SELECT COUNT(*) as count FROM recommendations');
    const [topicResult] = await sequelize.query('SELECT COUNT(*) as count FROM trending_topics');
    const [userRecResult] = await sequelize.query('SELECT COUNT(*) as count FROM user_recommendations');
    
    console.log('\n📊 Table Status:');
    console.log(`   Recommendations: ${recResult[0].count} records`);
    console.log(`   Trending Topics: ${topicResult[0].count} records`);
    console.log(`   User Recommendations: ${userRecResult[0].count} records`);
    
    if (recResult[0].count === '0' && topicResult[0].count === '0') {
      console.log('\n💡 Tables are empty. Ready for seeding!');
    }
    
    console.log('\n✨ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createRecommendationTablesOnly()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export default createRecommendationTablesOnly;

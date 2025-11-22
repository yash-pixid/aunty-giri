#!/usr/bin/env node

import { sequelize, Recommendation, TrendingTopic, UserRecommendation } from '../models/index.js';
import logger from '../utils/logger.js';

async function createRecommendationTables() {
  try {
    console.log('🔧 Creating recommendation tables...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Create tables if they don't exist
    await sequelize.sync({ 
      force: false, // Don't drop existing tables
      alter: false  // Don't alter existing tables
    });
    
    console.log('✅ Recommendation tables created successfully');
    
    // Check if tables exist and are empty
    const [recCount, topicCount, userRecCount] = await Promise.all([
      Recommendation.count(),
      TrendingTopic.count(), 
      UserRecommendation.count()
    ]);
    
    console.log('\n📊 Table Status:');
    console.log(`   Recommendations: ${recCount} records`);
    console.log(`   Trending Topics: ${topicCount} records`);
    console.log(`   User Recommendations: ${userRecCount} records`);
    
    if (recCount === 0 && topicCount === 0) {
      console.log('\n💡 Tables are empty. Run seed script to populate data:');
      console.log('   node scripts/seedRecommendations.js');
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
  createRecommendationTables()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export default createRecommendationTables;

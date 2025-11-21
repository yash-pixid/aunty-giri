import { testConnection } from './utils/db.js';
import logger from './utils/logger.js';

async function testDbConnection() {
  try {
    logger.info('Testing database connection...');
    await testConnection();
    logger.info('✅ Database connection successful!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testDbConnection();

import { sequelize } from './utils/db.js';
import logger from './utils/logger.js';
import { User, Activity, Screenshot, Keystroke, SystemMetric } from './models/index.js';

async function initializeDatabase() {
  try {
    logger.info('Starting database initialization...');
    
    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Log the database configuration
    const config = sequelize.config;
    logger.info(`Using database: ${config.database} on ${config.host}:${config.port}`);
    
    // Import models to ensure they're registered with Sequelize
    logger.info('Importing models...');
    logger.info(`- User model: ${User === undefined ? 'Not found' : 'Loaded'}`);
    
    // Sync all models with force: true to drop and recreate tables
    logger.info('Synchronizing database models...');
    
    // Enable logging for all queries
    const options = {
      force: true, // This will drop tables if they exist
      logging: (sql) => logger.debug(`[SEQUELIZE] ${sql}`)
    };
    
    await sequelize.sync(options);
    
    // Verify tables were created
    logger.info('\n✅ Database initialized successfully!');
    logger.info('\n=== Database Tables ===');
    
    try {
      const [results] = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      
      if (results && results.length > 0) {
        results.forEach(row => logger.info(`- ${row.table_name}`));
      } else {
        logger.info('No tables found in the database.');
      }
    } catch (error) {
      logger.error('Error listing database tables:', error);
    }
    
    logger.info('========================\n');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database initialization failed!');
    logger.error('Error details:', error);
    
    if (error.original) {
      logger.error('Original error:', error.original);
    }
    
    if (error.sql) {
      logger.error('Failed SQL:', error.sql);
    }
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the initialization
initializeDatabase();

import { sequelize } from './utils/db.js';
import logger from './utils/logger.js';
import { User, Activity, Screenshot, Keystroke, SystemMetric } from './models/index.js';

async function initializeDatabase() {
  try {
    logger.info('🔍 Starting database initialization...');
    
    // Test the connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');
    
    // Log database configuration
    const config = sequelize.config;
    logger.info(`📊 Using database: ${config.database} on ${config.host}:${config.port}`);
    
    // Drop all tables if they exist
    logger.info('🗑️  Dropping existing tables...');
    await sequelize.drop();
    
    // Sync all models
    logger.info('🔄 Creating database tables...');
    await sequelize.sync({ force: true });
    
    // Verify tables were created
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    logger.info('\n✅ Database initialized successfully!');
    logger.info('\n=== Database Tables ===');
    
    if (tables && tables.length > 0) {
      tables.forEach(table => logger.info(`- ${table.table_name}`));
    } else {
      logger.info('No tables found in the database.');
    }
    
    logger.info('========================\n');
    
    // Create a test admin user
    try {
      logger.info('👤 Creating test admin user...');
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // This will be hashed by the model hook
        role: 'admin'
      });
      
      logger.info(`✅ Test admin user created with ID: ${adminUser.id}`);
    } catch (userError) {
      logger.error('❌ Error creating test user:', userError);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database initialization failed!');
    logger.error('Error details:', error);
    
    if (error.original) {
      logger.error('Original error:', error.original);
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

import { Sequelize } from 'sequelize';
import config from '../config/database.js';
import logger from './logger.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

export const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    if (process.env.NODE_ENV !== 'production') {
      // Sync models with database (creates tables if they don't exist)
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }
    
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { Sequelize };

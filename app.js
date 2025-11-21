import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import { testConnection } from './utils/db.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Static files
app.use('/screenshots', express.static(path.join(__dirname, 'storage/screenshots')));

// Test database connection
app.use(async (req, res, next) => {
  try {
    await testConnection();
    next();
  } catch (error) {
    logger.error('Database connection error:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Database connection error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Dynamically import routes
const initializeApp = async () => {
  try {
    // Import routes
    const monitorRoutes = (await import('./routes/monitor.js')).default;
    const dashboardRoutes = (await import('./routes/dashboard.js')).default;
    const authRoutes = (await import('./routes/auth.js')).default;

    // API Routes
    app.use('/api/v1/monitor', monitorRoutes);
    app.use('/api/v1/dashboard', dashboardRoutes);
    app.use('/api/v1/auth', authRoutes);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Not Found',
        path: req.path
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      logger.error('Unhandled error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
      });

      res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  } catch (error) {
    logger.error('Error initializing application:', error);
    process.exit(1);
  }
};

// Initialize the application
initializeApp();

export default app;

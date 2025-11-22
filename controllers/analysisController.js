import { Screenshot } from '../models/index.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';
import { 
  queueScreenshotForProcessing, 
  getQueueStats, 
  retryFailedJob,
  processPendingScreenshots 
} from '../services/screenshotQueue.js';
import groqVisionService from '../services/groqVisionService.js';

/**
 * Get AI analysis for a specific screenshot
 */
export const getScreenshotAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const screenshot = await Screenshot.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!screenshot) {
      return res.status(404).json({
        status: 'error',
        message: 'Screenshot not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: screenshot.id,
        processing_status: screenshot.processing_status,
        processed_at: screenshot.processed_at,
        ai_analysis: screenshot.ai_analysis,
        processing_error: screenshot.processing_error,
        created_at: screenshot.created_at
      }
    });
  } catch (error) {
    logger.error('Error fetching screenshot analysis:', error);
    next(error);
  }
};

/**
 * Get analysis summary for user's screenshots
 */
export const getAnalysisSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const where = {
      user_id: req.user.id,
      processing_status: 'completed'
    };

    if (startDate && endDate) {
      where.processed_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const screenshots = await Screenshot.findAll({
      where,
      attributes: ['id', 'ai_analysis', 'processed_at', 'created_at'],
      order: [['processed_at', 'DESC']],
      limit: parseInt(limit, 10)
    });

    // Aggregate statistics
    const stats = {
      total_analyzed: screenshots.length,
      by_activity_type: {},
      by_activity_category: {},
      average_focus_score: 0,
      total_focus_score: 0
    };

    screenshots.forEach(screenshot => {
      if (screenshot.ai_analysis && Object.keys(screenshot.ai_analysis).length > 0) {
        const analysis = screenshot.ai_analysis;

        // Count by activity type
        if (analysis.activity_type) {
          stats.by_activity_type[analysis.activity_type] = 
            (stats.by_activity_type[analysis.activity_type] || 0) + 1;
        }

        // Count by category
        if (analysis.activity_category) {
          stats.by_activity_category[analysis.activity_category] = 
            (stats.by_activity_category[analysis.activity_category] || 0) + 1;
        }

        // Sum focus scores
        if (typeof analysis.focus_score === 'number') {
          stats.total_focus_score += analysis.focus_score;
        }
      }
    });

    // Calculate average focus score
    if (stats.total_analyzed > 0) {
      stats.average_focus_score = Math.round(stats.total_focus_score / stats.total_analyzed);
    }

    res.status(200).json({
      status: 'success',
      data: {
        summary: stats,
        recent_analyses: screenshots.map(s => ({
          id: s.id,
          analysis: s.ai_analysis,
          processed_at: s.processed_at,
          created_at: s.created_at
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching analysis summary:', error);
    next(error);
  }
};

/**
 * Manually trigger reprocessing of a screenshot
 */
export const reprocessScreenshot = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const screenshot = await Screenshot.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!screenshot) {
      return res.status(404).json({
        status: 'error',
        message: 'Screenshot not found'
      });
    }

    // Reset processing status
    await screenshot.update({
      processing_status: 'pending',
      processing_error: null
    });

    // Queue for processing
    const result = await queueScreenshotForProcessing(screenshot.id, screenshot.file_path);

    if (result.success) {
      res.status(200).json({
        status: 'success',
        message: 'Screenshot queued for reprocessing',
        data: {
          screenshot_id: screenshot.id,
          job_id: result.jobId
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to queue screenshot for reprocessing',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error reprocessing screenshot:', error);
    next(error);
  }
};

/**
 * Get processing queue statistics
 */
export const getQueueStatistics = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const queueStats = await getQueueStats();

    // Get database stats for this user
    const userStats = await Screenshot.findAll({
      where: { user_id: req.user.id },
      attributes: [
        'processing_status',
        [Screenshot.sequelize.fn('COUNT', Screenshot.sequelize.col('id')), 'count']
      ],
      group: ['processing_status'],
      raw: true
    });

    const dbStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    userStats.forEach(stat => {
      dbStats[stat.processing_status] = parseInt(stat.count, 10);
    });

    res.status(200).json({
      status: 'success',
      data: {
        queue: queueStats,
        user_screenshots: dbStats
      }
    });
  } catch (error) {
    logger.error('Error fetching queue statistics:', error);
    next(error);
  }
};

/**
 * Trigger batch processing of pending screenshots
 */
export const triggerBatchProcessing = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Only allow admin users to trigger batch processing
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { limit = 10 } = req.query;

    const result = await processPendingScreenshots(parseInt(limit, 10));

    res.status(200).json({
      status: 'success',
      message: 'Batch processing triggered',
      data: result
    });
  } catch (error) {
    logger.error('Error triggering batch processing:', error);
    next(error);
  }
};

/**
 * Check Groq API health
 */
export const checkAPIHealth = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const healthCheck = await groqVisionService.checkHealth();

    res.status(healthCheck.healthy ? 200 : 503).json({
      status: healthCheck.healthy ? 'success' : 'error',
      data: healthCheck
    });
  } catch (error) {
    logger.error('Error checking API health:', error);
    next(error);
  }
};

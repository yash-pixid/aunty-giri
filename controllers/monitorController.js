import { Activity, Screenshot, Keystroke, SystemMetric, sequelize } from '../models/index.js';
import MonitorService from '../services/MonitorService.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Op } from 'sequelize';
import sharp from 'sharp';
import { queueScreenshotForProcessing } from '../services/screenshotQueue.js';
import focusSessionService from '../services/focusSessionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Screenshot related methods
export const uploadScreenshot = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Authentication is now required
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const { filename, path: filePath, size } = req.file;
    
    // Get image dimensions
    const image = await sharp(filePath).metadata();
    
    const screenshot = await Screenshot.create({
      user_id: req.user.id,
      file_path: path.relative(process.cwd(), filePath),
      file_size: size,
      width: image.width,
      height: image.height,
      format: 'webp',
      metadata: {
        user_agent: req.headers['user-agent'],
        ip: req.ip,
        original_name: filename
      },
      processing_status: 'pending'
    });

    // Link to active focus session if exists
    focusSessionService.linkScreenshotToSession(req.user.id, screenshot.id)
      .catch(error => {
        logger.error('Error linking screenshot to focus session', {
          screenshotId: screenshot.id,
          error: error.message
        });
      });

    // Queue screenshot for AI processing (non-blocking)
    queueScreenshotForProcessing(screenshot.id, screenshot.file_path)
      .then(result => {
        if (result.success) {
          logger.info('Screenshot queued for AI analysis', {
            screenshotId: screenshot.id,
            jobId: result.jobId
          });
        } else {
          logger.error('Failed to queue screenshot for AI analysis', {
            screenshotId: screenshot.id,
            error: result.error
          });
        }
      })
      .catch(error => {
        logger.error('Error queuing screenshot', {
          screenshotId: screenshot.id,
          error: error.message
        });
      });

    res.status(201).json({
      status: 'success',
      data: {
        screenshot
      }
    });
  } catch (error) {
    logger.error('Error uploading screenshot:', error);
    next(error);
  }
};

export const getScreenshots = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        status: 'success',
        data: {
          total: 0,
          screenshots: []
        }
      });
    }
    
    const where = { userId: req.user.id };
    
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const screenshots = await Screenshot.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        total: screenshots.count,
        screenshots: screenshots.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching screenshots:', error);
    next(error);
  }
};

export const deleteScreenshot = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        status: 'success',
        message: 'Screenshot deletion skipped (unauthenticated)'
      });
    }
    
    const screenshot = await Screenshot.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    
    if (!screenshot) {
      return res.status(404).json({
        status: 'error',
        message: 'Screenshot not found'
      });
    }
    
    // Delete file from storage
    const filePath = path.join(process.cwd(), screenshot.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete record from database
    await screenshot.destroy();
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Error deleting screenshot:', error);
    next(error);
  }
};

// Activity tracking methods
export const logActivity = async (req, res, next) => {
  try {
    const { window_title, app_name, start_time, end_time, activity_type } = req.body;

    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Validate required fields for authenticated users
    if (!window_title || !app_name || !start_time || !end_time || !activity_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: window_title, app_name, start_time, end_time, activity_type are required'
      });
    }

    // Create activity with the validated values
    const activity = await Activity.create({
      user_id: req.user.id,
      window_title: window_title,
      app_name: app_name,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      activity_type: activity_type,
      duration: req.body.duration || 0,
      url: req.body.url || null
    });

    // Link to active focus session if exists
    focusSessionService.linkActivityToSession(req.user.id, activity.id)
      .catch(error => {
        logger.error('Error linking activity to focus session', {
          activityId: activity.id,
          error: error.message
        });
      });

    res.status(201).json({
      status: 'success',
      data: {
        activity
      }
    });
  } catch (error) {
    logger.error('Error logging activity:', error);
    next(error);
  }
};

export const getActivities = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 100, offset = 0, appName } = req.query;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    const where = { userId: req.user.id };
    
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (appName) {
      where.appName = appName;
    }
    
    const activities = await Activity.findAndCountAll({
      where,
      order: [['startTime', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        total: activities.count,
        activities: activities.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching activities:', error);
    next(error);
  }
};

export const getActivitySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        status: 'success',
        data: {
          total_time: 0,
          by_app: [],
          by_type: []
        }
      });
    }
    
    const where = { userId: req.user.id };
    
    if (startDate && endDate) {
      where.start_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Get total time spent
    const total_time = await Activity.sum('duration', { where });
    
    // Get time by application
    const by_app = await Activity.findAll({
      attributes: [
        'app_name',
        [sequelize.fn('SUM', sequelize.col('duration')), 'total_duration'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'activity_count']
      ],
      where,
      group: ['app_name'],
      order: [[sequelize.literal('total_duration'), 'DESC']]
    });
    
    // Get time by activity type
    const by_type = await Activity.findAll({
      attributes: [
        'activity_type',
        [sequelize.fn('SUM', sequelize.col('duration')), 'total_duration']
      ],
      where,
      group: ['activity_type'],
      order: [[sequelize.literal('total_duration'), 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        total_time: total_time || 0,
        by_app,
        by_type
      }
    });
  } catch (error) {
    logger.error('Error generating activity summary:', error);
    next(error);
  }
};

// Keystroke logging methods
export const logKeystrokes = async (req, res, next) => {
  try {
    const { key_log } = req.body;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      // Return a success response with mock data for unauthenticated requests
      return res.status(201).json({
        status: 'success',
        data: {
          keystrokes: key_log.map((key, index) => ({
            id: `anonymous-keystroke-${Date.now()}-${index}`,
            user_id: 'anonymous',
            key_code: key.key_code || 0,
            key_char: key.key_char || '',
            key_type: key.key_type || 'alphanumeric',
            timestamp: key.timestamp || new Date().toISOString(),
            window_title: key.window_title || 'Test Window',
            app_name: key.app_name || 'testapp',
            is_shortcut: key.is_shortcut || false,
            modifiers: key.modifiers || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
        }
      });
    }
    
    // For authenticated users, log the keystrokes to the database
    const keystrokes = await Keystroke.bulkCreate(
      key_log.map(key => ({
        userId: req.user.id,
        key_code: key.key_code || 0,
        key_char: key.key_char || null,
        key_type: key.key_type || 'alphanumeric',
        timestamp: key.timestamp || new Date(),
        window_title: key.window_title || null,
        app_name: key.app_name || 'unknown',
        is_shortcut: key.is_shortcut || false,
        modifiers: key.modifiers || []
      }))
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        keystrokes
      }
    });
  } catch (error) {
    logger.error('Error logging keystrokes:', error);
    next(error);
  }
};

export const getKeystrokes = async (req, res, next) => {
  try {
    const { start_date, end_date, limit = 100, offset = 0, app_name } = req.query;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    const where = { userId: req.user.id };
    
    if (start_date && end_date) {
      where.timestamp = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    
    if (app_name) {
      where.app_name = app_name;
    }
    
    const keystrokes = await Keystroke.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        total: keystrokes.count,
        keystrokes: keystrokes.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching keystrokes:', error);
    next(error);
  }
};

// System metrics methods
export const logMetrics = async (req, res, next) => {
  try {
    const { cpu, memory, disk, network } = req.body;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(201).json({
        status: 'success',
        data: {
          metric: {
            id: `anonymous-metric-${Date.now()}`,
            user_id: 'anonymous',
            cpu_usage: cpu?.usage || 0,
            cpu_temperature: cpu?.temperature || 0,
            memory_usage: memory?.usage || 0,
            disk_usage: disk?.usage || 0,
            disk_read: disk?.read || 0,
            disk_write: disk?.write || 0,
            network_in: network?.in || 0,
            network_out: network?.out || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      });
    }
    
    const metric = await SystemMetric.create({
      userId: req.user.id,
      cpu_usage: cpu.usage || 0,
      memory_usage: memory.usage || 0,
      disk_usage: disk.usage || 0,
      network_in: network.in || 0,
      network_out: network.out || 0,
      cpu_temperature: cpu.temperature || null,
      disk_read: disk.read || 0,
      disk_write: disk.write || 0,
      timestamp: new Date(),
      metrics: {
        cpu,
        memory,
        disk,
        network
      }
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        metric
      }
    });
  } catch (error) {
    logger.error('Error logging system metrics:', error);
    next(error);
  }
};

export const getMetrics = async (req, res, next) => {
  try {
    const { start_date, end_date, limit = 100, offset = 0 } = req.query;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    const where = { userId: req.user.id };
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    
    const metrics = await SystemMetric.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        total: metrics.count,
        metrics: metrics.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    next(error);
  }
};

export const getMetricsSummary = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Handle unauthenticated requests
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Remove this check after replacement
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        status: 'success',
        data: {
          cpu: { avg_usage: 0, max_usage: 0, avg_temp: 0 },
          memory: { avg_usage: 0, max_usage: 0 },
          disk: { avg_usage: 0, total_read: 0, total_write: 0 },
          network: { total_in: 0, total_out: 0 }
        }
      });
    }
    
    const where = { userId: req.user.id };
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    
    // Get average metrics
    const avg_metrics = await SystemMetric.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('cpu_usage')), 'avg_cpu_usage'],
        [sequelize.fn('AVG', sequelize.col('memory_usage')), 'avg_memory_usage'],
        [sequelize.fn('AVG', sequelize.col('disk_usage')), 'avg_disk_usage'],
        [sequelize.fn('AVG', sequelize.col('network_in')), 'avg_network_in'],
        [sequelize.fn('AVG', sequelize.col('network_out')), 'avg_network_out'],
        [sequelize.fn('AVG', sequelize.col('cpu_temperature')), 'avg_cpu_temp'],
        [sequelize.fn('AVG', sequelize.col('disk_read')), 'avg_disk_read'],
        [sequelize.fn('AVG', sequelize.col('disk_write')), 'avg_disk_write']
      ],
      where,
      raw: true
    });
    
    res.status(200).json({
      status: 'success',
      data: avg_metrics || {}
    });
  } catch (error) {
    logger.error('Error generating metrics summary:', error);
    next(error);
  }
};

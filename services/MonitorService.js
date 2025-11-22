import { Activity, Screenshot, Keystroke, SystemMetric, sequelize } from '../models/index.js';
import { Op, fn, col } from 'sequelize';
import logger from '../utils/logger.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

class MonitorService {
  /**
   * Upload and process screenshot
   */
  async uploadScreenshot(userId, file, metadata = {}) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      const { filename, path: filePath, size } = file;
      
      // Get image dimensions using Sharp
      const image = await sharp(filePath).metadata();
      
      const screenshot = await Screenshot.create({
        userId,
        file_path: path.relative(process.cwd(), filePath),
        file_size: size,
        width: image.width,
        height: image.height,
        format: 'webp',
        metadata: {
          user_agent: metadata.userAgent,
          ip: metadata.ip,
          original_name: filename,
          ...metadata
        }
      });

      return screenshot;
    } catch (error) {
      logger.error('Error uploading screenshot:', error);
      throw error;
    }
  }

  /**
   * Get screenshots for user with pagination and filtering
   */
  async getScreenshots(userId, { startDate, endDate, limit = 50, offset = 0 } = {}) {
    try {
      const where = { userId, is_archived: false };
      
      if (startDate && endDate) {
        where.created_at = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const { count, rows: screenshots } = await Screenshot.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });

      return {
        total: count,
        screenshots
      };
    } catch (error) {
      logger.error('Error getting screenshots:', error);
      throw error;
    }
  }

  /**
   * Delete screenshot
   */
  async deleteScreenshot(userId, screenshotId) {
    try {
      const screenshot = await Screenshot.findOne({
        where: { id: screenshotId, userId }
      });

      if (!screenshot) {
        throw new Error('Screenshot not found');
      }

      // Delete file from filesystem
      const filePath = path.join(process.cwd(), screenshot.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await screenshot.destroy();

      return { message: 'Screenshot deleted successfully' };
    } catch (error) {
      logger.error('Error deleting screenshot:', error);
      throw error;
    }
  }

  /**
   * Log activity
   */
  async logActivity(userId, activityData) {
    try {
      const { window_title, app_name, start_time, end_time, activity_type, url, metadata } = activityData;

      // Calculate duration
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      const duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds

      const activity = await Activity.create({
        user_id: userId,
        window_title,
        app_name,
        start_time: startTime,
        end_time: endTime,
        duration,
        activity_type,
        url: url || null,
        metadata: metadata || {}
      });

      return activity;
    } catch (error) {
      logger.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Get activities for user with filtering
   */
  async getActivities(userId, { startDate, endDate, limit = 100, offset = 0, appName } = {}) {
    try {
      const where = { userId };
      
      if (startDate && endDate) {
        where.start_time = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      if (appName) {
        where.app_name = {
          [Op.iLike]: `%${appName}%`
        };
      }

      const { count, rows: activities } = await Activity.findAndCountAll({
        where,
        order: [['start_time', 'DESC']],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });

      return {
        total: count,
        activities
      };
    } catch (error) {
      logger.error('Error getting activities:', error);
      throw error;
    }
  }

  /**
   * Get activity summary for user
   */
  async getActivitySummary(userId, { startDate, endDate } = {}) {
    try {
      const where = { userId };
      
      if (startDate && endDate) {
        where.start_time = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Get summary by app
      const byApp = await Activity.findAll({
        where,
        attributes: [
          'app_name',
          [fn('SUM', col('duration')), 'total_duration'],
          [fn('COUNT', col('id')), 'activity_count']
        ],
        group: ['app_name'],
        order: [[fn('SUM', col('duration')), 'DESC']],
        raw: true
      });

      // Get summary by type
      const byType = await Activity.findAll({
        where,
        attributes: [
          'activity_type',
          [fn('SUM', col('duration')), 'total_duration']
        ],
        group: ['activity_type'],
        raw: true
      });

      // Calculate total time
      const totalTime = byApp.reduce((sum, app) => sum + parseFloat(app.total_duration || 0), 0);

      return {
        total_time: totalTime,
        by_app: byApp.map(app => ({
          ...app,
          total_duration: parseFloat(app.total_duration || 0)
        })),
        by_type: byType.map(type => ({
          ...type,
          total_duration: parseFloat(type.total_duration || 0)
        }))
      };
    } catch (error) {
      logger.error('Error getting activity summary:', error);
      throw error;
    }
  }

  /**
   * Log keystrokes (bulk)
   */
  async logKeystrokes(userId, keystrokesData) {
    try {
      const { key_log } = keystrokesData;

      if (!Array.isArray(key_log) || key_log.length === 0) {
        throw new Error('Invalid keystrokes data');
      }

      // Add userId to each keystroke
      const keystrokes = key_log.map(keystroke => ({
        ...keystroke,
        userId,
        timestamp: new Date(keystroke.timestamp)
      }));

      const createdKeystrokes = await Keystroke.bulkCreate(keystrokes);

      return {
        keystrokes: createdKeystrokes
      };
    } catch (error) {
      logger.error('Error logging keystrokes:', error);
      throw error;
    }
  }

  /**
   * Get keystrokes for user
   */
  async getKeystrokes(userId, { start_date, end_date, limit = 100, offset = 0, app_name } = {}) {
    try {
      const where = { userId };
      
      if (start_date && end_date) {
        where.timestamp = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      if (app_name) {
        where.app_name = {
          [Op.iLike]: `%${app_name}%`
        };
      }

      const { count, rows: keystrokes } = await Keystroke.findAndCountAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });

      return {
        total: count,
        keystrokes
      };
    } catch (error) {
      logger.error('Error getting keystrokes:', error);
      throw error;
    }
  }

  /**
   * Log system metrics
   */
  async logSystemMetrics(userId, metricsData) {
    try {
      const { cpu, memory, disk, network } = metricsData;

      const metrics = await SystemMetric.create({
        userId,
        cpu_usage: cpu.usage,
        memory_usage: memory.usage,
        disk_usage: disk.usage,
        network_in: network?.in || 0,
        network_out: network?.out || 0,
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

      return metrics;
    } catch (error) {
      logger.error('Error logging system metrics:', error);
      throw error;
    }
  }

  /**
   * Get system metrics for user
   */
  async getSystemMetrics(userId, { start_date, end_date, limit = 100, offset = 0 } = {}) {
    try {
      const where = { userId };
      
      if (start_date && end_date) {
        where.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      const { count, rows: metrics } = await SystemMetric.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });

      return {
        total: count,
        metrics
      };
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Get system metrics summary
   */
  async getMetricsSummary(userId, { start_date, end_date } = {}) {
    try {
      const where = { userId };
      
      if (start_date && end_date) {
        where.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      const avgMetrics = await SystemMetric.findOne({
        where,
        attributes: [
          [fn('AVG', col('cpu_usage')), 'avg_cpu_usage'],
          [fn('AVG', col('memory_usage')), 'avg_memory_usage'],
          [fn('AVG', col('disk_usage')), 'avg_disk_usage'],
          [fn('AVG', col('network_in')), 'avg_network_in'],
          [fn('AVG', col('network_out')), 'avg_network_out'],
          [fn('AVG', col('cpu_temperature')), 'avg_cpu_temp'],
          [fn('AVG', col('disk_read')), 'avg_disk_read'],
          [fn('AVG', col('disk_write')), 'avg_disk_write']
        ],
        raw: true
      });

      return avgMetrics || {};
    } catch (error) {
      logger.error('Error getting metrics summary:', error);
      throw error;
    }
  }
}

export default new MonitorService();

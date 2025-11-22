import focusSessionService from '../services/focusSessionService.js';
import focusAnalyticsService from '../services/focusAnalyticsService.js';
import { FocusSession, FocusBlocklist } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

/**
 * Start a new focus session
 * POST /api/v1/focus/sessions/start
 */
export const startSession = async (req, res, next) => {
  try {
    const { goal, subject, planned_duration, session_type } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!goal || !planned_duration) {
      return res.status(400).json({
        status: 'error',
        message: 'Goal and planned_duration are required'
      });
    }

    if (planned_duration < 1 || planned_duration > 300) {
      return res.status(400).json({
        status: 'error',
        message: 'Planned duration must be between 1 and 300 minutes'
      });
    }

    const session = await focusSessionService.startSession(req.user.id, {
      goal,
      subject,
      planned_duration,
      session_type
    });

    const plannedEndTime = new Date(
      new Date(session.start_time).getTime() + planned_duration * 60 * 1000
    );

    res.status(201).json({
      status: 'success',
      data: {
        session_id: session.id,
        goal: session.goal,
        subject: session.subject,
        planned_duration: session.planned_duration,
        session_type: session.session_type,
        start_time: session.start_time,
        planned_end_time: plannedEndTime,
        status: session.status
      }
    });
  } catch (error) {
    logger.error('Error starting focus session:', error);
    
    if (error.message.includes('already has an active')) {
      return res.status(409).json({
        status: 'error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Get active focus session
 * GET /api/v1/focus/sessions/active
 */
export const getActiveSession = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const session = await focusSessionService.getActiveSession(req.user.id);

    if (!session) {
      return res.status(200).json({
        status: 'success',
        data: null,
        message: 'No active session'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        session_id: session.id,
        goal: session.goal,
        subject: session.subject,
        start_time: session.start_time,
        elapsed_time: session.elapsed_time,
        planned_duration: session.planned_duration * 60, // Convert to seconds
        planned_end_time: session.planned_end_time,
        status: session.status,
        pause_count: session.pause_count,
        current_stats: {
          productive_time: session.productive_time,
          neutral_time: session.neutral_time,
          distracting_time: session.distracting_time,
          app_switches: session.app_switches,
          distraction_count: session.distraction_count
        }
      }
    });
  } catch (error) {
    logger.error('Error getting active session:', error);
    next(error);
  }
};

/**
 * Pause focus session
 * POST /api/v1/focus/sessions/:id/pause
 */
export const pauseSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const session = await focusSessionService.pauseSession(id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        session_id: session.id,
        status: session.status,
        pause_count: session.pause_count
      },
      message: 'Session paused successfully'
    });
  } catch (error) {
    logger.error('Error pausing session:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Resume focus session
 * POST /api/v1/focus/sessions/:id/resume
 */
export const resumeSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const session = await focusSessionService.resumeSession(id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        session_id: session.id,
        status: session.status
      },
      message: 'Session resumed successfully'
    });
  } catch (error) {
    logger.error('Error resuming session:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * End focus session
 * POST /api/v1/focus/sessions/:id/end
 */
export const endSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, status = 'completed' } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (status && !['completed', 'abandoned'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "completed" or "abandoned"'
      });
    }

    const result = await focusSessionService.endSession(id, req.user.id, {
      notes,
      status
    });

    // Get detailed report
    const report = await focusAnalyticsService.generateSessionReport(id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        session_id: result.session.id,
        summary: {
          actual_duration: result.summary.actual_duration,
          focus_score: result.summary.focus_score,
          productivity_score: result.summary.productivity_score,
          productive_time: result.summary.productive_time,
          neutral_time: result.summary.neutral_time,
          distracting_time: result.summary.distracting_time,
          app_switches: result.summary.app_switches,
          distraction_count: result.summary.distraction_count,
          top_apps: report.activity_breakdown.slice(0, 5),
          distractions: report.distractions
        },
        ai_insights: report.ai_insights
      },
      message: `Session ${status} successfully`
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Get session history
 * GET /api/v1/focus/sessions
 */
export const getSessionHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, subject, status } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const offset = (page - 1) * limit;
    const where = {
      user_id: req.user.id,
      status: {
        [Op.in]: ['completed', 'abandoned']
      }
    };

    if (startDate && endDate) {
      where.start_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (subject) {
      where.subject = subject;
    }

    if (status && ['completed', 'abandoned'].includes(status)) {
      where.status = status;
    }

    const { count, rows: sessions } = await FocusSession.findAndCountAll({
      where,
      order: [['start_time', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.status(200).json({
      status: 'success',
      data: {
        total: count,
        total_pages: Math.ceil(count / limit),
        current_page: parseInt(page, 10),
        sessions: sessions.map(s => ({
          id: s.id,
          goal: s.goal,
          subject: s.subject,
          start_time: s.start_time,
          end_time: s.end_time,
          actual_duration: s.actual_duration,
          planned_duration: s.planned_duration,
          status: s.status,
          focus_score: s.focus_score,
          productivity_score: s.productivity_score
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting session history:', error);
    next(error);
  }
};

/**
 * Get session details
 * GET /api/v1/focus/sessions/:id
 */
export const getSessionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const report = await focusAnalyticsService.generateSessionReport(id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    logger.error('Error getting session details:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }
    
    next(error);
  }
};

/**
 * Get focus analytics
 * GET /api/v1/focus/analytics
 */
export const getFocusAnalytics = async (req, res, next) => {
  try {
    const { period = 'week', startDate, endDate } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const analytics = await focusAnalyticsService.getUserFocusAnalytics(req.user.id, {
      period,
      startDate,
      endDate
    });

    res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting focus analytics:', error);
    next(error);
  }
};

/**
 * Get focus recommendations
 * GET /api/v1/focus/recommendations
 */
export const getFocusRecommendations = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const recommendations = await focusAnalyticsService.getPersonalizedRecommendations(req.user.id);

    res.status(200).json({
      status: 'success',
      data: recommendations
    });
  } catch (error) {
    logger.error('Error getting focus recommendations:', error);
    next(error);
  }
};

/**
 * Get blocklist
 * GET /api/v1/focus/blocklist
 */
export const getBlocklist = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const blocklist = await FocusBlocklist.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: {
        items: blocklist.map(item => ({
          id: item.id,
          item_type: item.item_type,
          item_value: item.item_value,
          is_global: item.is_global,
          created_at: item.created_at
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting blocklist:', error);
    next(error);
  }
};

/**
 * Add to blocklist
 * POST /api/v1/focus/blocklist
 */
export const addToBlocklist = async (req, res, next) => {
  try {
    const { item_type, item_value, is_global = false } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!item_type || !item_value) {
      return res.status(400).json({
        status: 'error',
        message: 'item_type and item_value are required'
      });
    }

    if (!['app', 'website', 'category'].includes(item_type)) {
      return res.status(400).json({
        status: 'error',
        message: 'item_type must be one of: app, website, category'
      });
    }

    const item = await FocusBlocklist.create({
      user_id: req.user.id,
      item_type,
      item_value,
      is_global
    });

    res.status(201).json({
      status: 'success',
      data: {
        id: item.id,
        item_type: item.item_type,
        item_value: item.item_value,
        is_global: item.is_global,
        created_at: item.created_at
      },
      message: 'Item added to blocklist'
    });
  } catch (error) {
    logger.error('Error adding to blocklist:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: 'error',
        message: 'Item already exists in blocklist'
      });
    }
    
    next(error);
  }
};

/**
 * Remove from blocklist
 * DELETE /api/v1/focus/blocklist/:id
 */
export const removeFromBlocklist = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const deleted = await FocusBlocklist.destroy({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (deleted === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Blocklist item not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Item removed from blocklist'
    });
  } catch (error) {
    logger.error('Error removing from blocklist:', error);
    next(error);
  }
};

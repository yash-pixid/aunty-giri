import { FocusSession, FocusSessionEvent, Activity, Screenshot } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

class FocusSessionService {
  /**
   * Start a new focus session
   */
  async startSession(userId, { goal, subject, planned_duration, session_type = 'custom' }) {
    try {
      // Check if user already has an active session
      const existingSession = await FocusSession.findOne({
        where: {
          user_id: userId,
          status: {
            [Op.in]: ['active', 'paused']
          }
        }
      });

      if (existingSession) {
        throw new Error('User already has an active focus session. Please end or abandon it first.');
      }

      // Create new session
      const session = await FocusSession.create({
        user_id: userId,
        goal,
        subject,
        planned_duration,
        session_type,
        start_time: new Date(),
        status: 'active'
      });

      // Create started event
      await FocusSessionEvent.create({
        session_id: session.id,
        event_type: 'started',
        event_data: {
          goal,
          subject,
          planned_duration,
          session_type
        }
      });

      logger.info('Focus session started', {
        userId,
        sessionId: session.id,
        goal,
        planned_duration
      });

      return session;
    } catch (error) {
      logger.error('Error starting focus session:', error);
      throw error;
    }
  }

  /**
   * Get user's active session
   */
  async getActiveSession(userId) {
    try {
      const session = await FocusSession.findOne({
        where: {
          user_id: userId,
          status: {
            [Op.in]: ['active', 'paused']
          }
        },
        order: [['start_time', 'DESC']]
      });

      if (!session) {
        return null;
      }

      // Calculate elapsed time
      const now = new Date();
      const elapsedMs = now - new Date(session.start_time);
      const elapsedSeconds = Math.floor(elapsedMs / 1000) - (session.total_pause_duration || 0);

      return {
        ...session.toJSON(),
        elapsed_time: elapsedSeconds,
        planned_end_time: new Date(
          new Date(session.start_time).getTime() + session.planned_duration * 60 * 1000
        )
      };
    } catch (error) {
      logger.error('Error getting active session:', error);
      throw error;
    }
  }

  /**
   * Pause active session
   */
  async pauseSession(sessionId, userId) {
    try {
      const session = await FocusSession.findOne({
        where: {
          id: sessionId,
          user_id: userId,
          status: 'active'
        }
      });

      if (!session) {
        throw new Error('Active session not found');
      }

      await session.update({
        status: 'paused',
        pause_count: (session.pause_count || 0) + 1
      });

      // Create paused event
      await FocusSessionEvent.create({
        session_id: sessionId,
        event_type: 'paused',
        event_data: {
          pause_count: session.pause_count + 1
        }
      });

      logger.info('Focus session paused', { sessionId, userId });

      return session;
    } catch (error) {
      logger.error('Error pausing session:', error);
      throw error;
    }
  }

  /**
   * Resume paused session
   */
  async resumeSession(sessionId, userId) {
    try {
      const session = await FocusSession.findOne({
        where: {
          id: sessionId,
          user_id: userId,
          status: 'paused'
        }
      });

      if (!session) {
        throw new Error('Paused session not found');
      }

      // Get the last pause event to calculate pause duration
      const lastPauseEvent = await FocusSessionEvent.findOne({
        where: {
          session_id: sessionId,
          event_type: 'paused'
        },
        order: [['timestamp', 'DESC']]
      });

      if (lastPauseEvent) {
        const pauseDuration = Math.floor((new Date() - new Date(lastPauseEvent.timestamp)) / 1000);
        await session.update({
          status: 'active',
          total_pause_duration: (session.total_pause_duration || 0) + pauseDuration
        });
      } else {
        await session.update({
          status: 'active'
        });
      }

      // Create resumed event
      await FocusSessionEvent.create({
        session_id: sessionId,
        event_type: 'resumed',
        event_data: {}
      });

      logger.info('Focus session resumed', { sessionId, userId });

      return session;
    } catch (error) {
      logger.error('Error resuming session:', error);
      throw error;
    }
  }

  /**
   * End focus session and calculate metrics
   */
  async endSession(sessionId, userId, { notes = null, status = 'completed' } = {}) {
    try {
      const session = await FocusSession.findOne({
        where: {
          id: sessionId,
          user_id: userId,
          status: {
            [Op.in]: ['active', 'paused']
          }
        }
      });

      if (!session) {
        throw new Error('Active session not found');
      }

      const endTime = new Date();
      const actualDurationMs = endTime - new Date(session.start_time);
      const actualDurationMinutes = Math.floor(actualDurationMs / 1000 / 60);

      // Calculate focus metrics from activities and screenshots
      const metrics = await this.calculateFocusMetrics(sessionId);

      // Update session with final data
      await session.update({
        status,
        end_time: endTime,
        actual_duration: actualDurationMinutes,
        notes,
        ...metrics
      });

      // Create completed/abandoned event
      await FocusSessionEvent.create({
        session_id: sessionId,
        event_type: status,
        event_data: {
          actual_duration: actualDurationMinutes,
          focus_score: metrics.focus_score,
          productivity_score: metrics.productivity_score
        }
      });

      logger.info('Focus session ended', {
        sessionId,
        userId,
        status,
        actualDuration: actualDurationMinutes,
        focusScore: metrics.focus_score
      });

      // Return session with summary
      return {
        session,
        summary: {
          actual_duration: actualDurationMinutes,
          ...metrics
        }
      };
    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Calculate focus metrics from activities and screenshots
   */
  async calculateFocusMetrics(sessionId) {
    try {
      // Get all activities for this session
      const activities = await Activity.findAll({
        where: { focus_session_id: sessionId }
      });

      // Get all screenshots with AI analysis for this session
      const screenshots = await Screenshot.findAll({
        where: {
          focus_session_id: sessionId,
          processing_status: 'completed'
        }
      });

      // Categorize activities
      const categories = {
        productive: ['vscode', 'visual studio code', 'intellij', 'pycharm', 'sublime', 'atom', 'terminal', 'iterm', 'notion', 'obsidian', 'evernote', 'slack', 'teams', 'zoom', 'meet'],
        neutral: ['finder', 'explorer', 'settings', 'system preferences', 'mail', 'outlook', 'calendar'],
        distracting: ['youtube', 'facebook', 'twitter', 'instagram', 'netflix', 'spotify', 'reddit', 'tiktok', 'gaming', 'games', 'discord']
      };

      let productiveTime = 0;
      let neutralTime = 0;
      let distractingTime = 0;
      let appSwitches = activities.length;
      let distractionCount = 0;

      activities.forEach(activity => {
        const app = (activity.app_name || '').toLowerCase();
        const duration = parseFloat(activity.duration || 0);

        if (categories.productive.some(p => app.includes(p))) {
          productiveTime += duration;
        } else if (categories.distracting.some(d => app.includes(d))) {
          distractingTime += duration;
          distractionCount++;
        } else {
          neutralTime += duration;
        }
      });

      // Calculate AI-based focus score from screenshots
      let totalFocusScore = 0;
      let focusScoreCount = 0;
      const aiInsights = {
        attention_levels: [],
        activity_categories: [],
        activity_types: []
      };

      screenshots.forEach(screenshot => {
        if (screenshot.ai_analysis && Object.keys(screenshot.ai_analysis).length > 0) {
          const analysis = screenshot.ai_analysis;

          if (typeof analysis.focus_score === 'number') {
            totalFocusScore += analysis.focus_score;
            focusScoreCount++;
          }

          if (analysis.attention_level) {
            aiInsights.attention_levels.push(analysis.attention_level);
          }

          if (analysis.activity_category) {
            aiInsights.activity_categories.push(analysis.activity_category);
          }

          if (analysis.activity_type) {
            aiInsights.activity_types.push(analysis.activity_type);
          }
        }
      });

      const avgFocusScore = focusScoreCount > 0 
        ? parseFloat((totalFocusScore / focusScoreCount).toFixed(2))
        : null;

      // Calculate productivity score
      const totalTime = productiveTime + neutralTime + distractingTime;
      const productivityScore = totalTime > 0
        ? parseFloat(((productiveTime / totalTime) * 100).toFixed(2))
        : null;

      return {
        focus_score: avgFocusScore,
        productivity_score: productivityScore,
        distraction_count: distractionCount,
        app_switches: appSwitches,
        productive_time: Math.round(productiveTime),
        neutral_time: Math.round(neutralTime),
        distracting_time: Math.round(distractingTime),
        ai_summary: {
          total_screenshots: screenshots.length,
          analyzed_screenshots: focusScoreCount,
          ...aiInsights
        }
      };
    } catch (error) {
      logger.error('Error calculating focus metrics:', error);
      return {
        focus_score: null,
        productivity_score: null,
        distraction_count: 0,
        app_switches: 0,
        productive_time: 0,
        neutral_time: 0,
        distracting_time: 0,
        ai_summary: {}
      };
    }
  }

  /**
   * Link activity to active session if exists
   */
  async linkActivityToSession(userId, activityId) {
    try {
      const activeSession = await FocusSession.findOne({
        where: {
          user_id: userId,
          status: 'active'
        }
      });

      if (activeSession) {
        await Activity.update(
          { focus_session_id: activeSession.id },
          { where: { id: activityId } }
        );

        logger.debug('Activity linked to focus session', {
          activityId,
          sessionId: activeSession.id
        });
      }
    } catch (error) {
      logger.error('Error linking activity to session:', error);
    }
  }

  /**
   * Link screenshot to active session if exists
   */
  async linkScreenshotToSession(userId, screenshotId) {
    try {
      const activeSession = await FocusSession.findOne({
        where: {
          user_id: userId,
          status: 'active'
        }
      });

      if (activeSession) {
        await Screenshot.update(
          { focus_session_id: activeSession.id },
          { where: { id: screenshotId } }
        );

        logger.debug('Screenshot linked to focus session', {
          screenshotId,
          sessionId: activeSession.id
        });
      }
    } catch (error) {
      logger.error('Error linking screenshot to session:', error);
    }
  }

  /**
   * Track app switch event
   */
  async trackAppSwitch(sessionId, appName) {
    try {
      await FocusSessionEvent.create({
        session_id: sessionId,
        event_type: 'app_switched',
        event_data: { app_name: appName }
      });

      // Increment app_switches counter
      await FocusSession.increment('app_switches', {
        where: { id: sessionId }
      });
    } catch (error) {
      logger.error('Error tracking app switch:', error);
    }
  }

  /**
   * Track distraction event
   */
  async trackDistraction(sessionId, appName) {
    try {
      await FocusSessionEvent.create({
        session_id: sessionId,
        event_type: 'distraction_detected',
        event_data: { app_name: appName }
      });

      // Increment distraction counter
      await FocusSession.increment('distraction_count', {
        where: { id: sessionId }
      });
    } catch (error) {
      logger.error('Error tracking distraction:', error);
    }
  }
}

export default new FocusSessionService();

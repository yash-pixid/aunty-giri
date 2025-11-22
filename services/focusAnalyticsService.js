import { FocusSession, FocusSessionEvent, Activity, Screenshot, sequelize } from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';
import logger from '../utils/logger.js';

class FocusAnalyticsService {
  /**
   * Get comprehensive focus analytics for a user
   */
  async getUserFocusAnalytics(userId, { period = 'week', startDate, endDate } = {}) {
    try {
      // Calculate date range
      const dateRange = this.getDateRange(period, startDate, endDate);

      const sessions = await FocusSession.findAll({
        where: {
          user_id: userId,
          start_time: {
            [Op.between]: [dateRange.start, dateRange.end]
          },
          status: {
            [Op.in]: ['completed', 'abandoned']
          }
        },
        order: [['start_time', 'DESC']]
      });

      if (sessions.length === 0) {
        return {
          summary: {
            total_sessions: 0,
            total_focus_time: 0,
            average_focus_score: null,
            average_productivity_score: null,
            completed_sessions: 0,
            abandoned_sessions: 0
          },
          trends: {},
          by_subject: {},
          best_time_of_day: {},
          common_distractions: []
        };
      }

      // Calculate summary statistics
      const summary = this.calculateSummaryStats(sessions);

      // Calculate trends
      const trends = await this.calculateTrends(userId, sessions);

      // Group by subject
      const bySubject = this.groupBySubject(sessions);

      // Best time of day
      const bestTimeOfDay = this.calculateBestTimeOfDay(sessions);

      // Common distractions
      const commonDistractions = await this.getCommonDistractions(userId, dateRange);

      return {
        summary,
        trends,
        by_subject: bySubject,
        best_time_of_day: bestTimeOfDay,
        common_distractions: commonDistractions
      };
    } catch (error) {
      logger.error('Error getting user focus analytics:', error);
      throw error;
    }
  }

  /**
   * Generate detailed session report
   */
  async generateSessionReport(sessionId, userId) {
    try {
      const session = await FocusSession.findOne({
        where: {
          id: sessionId,
          user_id: userId
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Get events
      const events = await FocusSessionEvent.findAll({
        where: { session_id: sessionId },
        order: [['timestamp', 'ASC']]
      });

      // Get activities
      const activities = await Activity.findAll({
        where: { focus_session_id: sessionId },
        order: [['start_time', 'ASC']]
      });

      // Get screenshots with AI analysis
      const screenshots = await Screenshot.findAll({
        where: {
          focus_session_id: sessionId,
          processing_status: 'completed'
        },
        order: [['created_at', 'ASC']]
      });

      // Group activities by app
      const activityBreakdown = this.groupActivitiesByApp(activities);

      // Extract distractions
      const distractions = events
        .filter(e => e.event_type === 'distraction_detected')
        .map(e => ({
          timestamp: e.timestamp,
          app: e.event_data.app_name
        }));

      // AI insights summary
      const aiInsights = this.extractAIInsights(screenshots);

      return {
        session: session.toJSON(),
        timeline: {
          events: events.map(e => ({
            type: e.event_type,
            timestamp: e.timestamp,
            data: e.event_data
          })),
          activities: activities.map(a => ({
            app: a.app_name,
            start: a.start_time,
            end: a.end_time,
            duration: a.duration
          }))
        },
        activity_breakdown: activityBreakdown,
        distractions,
        ai_insights: aiInsights,
        screenshots_count: screenshots.length
      };
    } catch (error) {
      logger.error('Error generating session report:', error);
      throw error;
    }
  }

  /**
   * Get focus trends over time
   */
  async getFocusTrends(userId, { days = 30 } = {}) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sessions = await FocusSession.findAll({
        where: {
          user_id: userId,
          start_time: {
            [Op.gte]: startDate
          },
          status: 'completed',
          focus_score: {
            [Op.ne]: null
          }
        },
        attributes: [
          [fn('DATE', col('start_time')), 'date'],
          [fn('AVG', col('focus_score')), 'avg_focus_score'],
          [fn('AVG', col('productivity_score')), 'avg_productivity_score'],
          [fn('COUNT', col('id')), 'session_count']
        ],
        group: [fn('DATE', col('start_time'))],
        order: [[fn('DATE', col('start_time')), 'ASC']],
        raw: true
      });

      return {
        period: `${days} days`,
        data: sessions.map(s => ({
          date: s.date,
          avg_focus_score: parseFloat(s.avg_focus_score || 0).toFixed(2),
          avg_productivity_score: parseFloat(s.avg_productivity_score || 0).toFixed(2),
          session_count: parseInt(s.session_count, 10)
        }))
      };
    } catch (error) {
      logger.error('Error getting focus trends:', error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(userId) {
    try {
      // Get last 30 days of sessions
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const sessions = await FocusSession.findAll({
        where: {
          user_id: userId,
          start_time: {
            [Op.gte]: startDate
          },
          status: 'completed'
        }
      });

      if (sessions.length === 0) {
        return {
          optimal_duration: 25,
          best_time: 'Not enough data',
          suggested_breaks: 'Every 25-50 minutes',
          improvement_areas: [
            'Start tracking focus sessions to get personalized insights!'
          ]
        };
      }

      const recommendations = {
        optimal_duration: this.findOptimalDuration(sessions),
        best_time: this.findBestTimeOfDay(sessions),
        suggested_breaks: this.suggestBreakPattern(sessions),
        improvement_areas: this.generateImprovementAreas(sessions)
      };

      return recommendations;
    } catch (error) {
      logger.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  // Helper methods

  getDateRange(period, startDate, endDate) {
    if (startDate && endDate) {
      return {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  }

  calculateSummaryStats(sessions) {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const abandonedSessions = sessions.filter(s => s.status === 'abandoned');

    const totalFocusTime = sessions.reduce((sum, s) => sum + (s.actual_duration || 0), 0);
    
    const focusScores = sessions
      .map(s => parseFloat(s.focus_score))
      .filter(s => !isNaN(s) && s !== null);
    
    const productivityScores = sessions
      .map(s => parseFloat(s.productivity_score))
      .filter(s => !isNaN(s) && s !== null);

    return {
      total_sessions: sessions.length,
      total_focus_time: totalFocusTime,
      average_focus_score: focusScores.length > 0
        ? parseFloat((focusScores.reduce((a, b) => a + b, 0) / focusScores.length).toFixed(2))
        : null,
      average_productivity_score: productivityScores.length > 0
        ? parseFloat((productivityScores.reduce((a, b) => a + b, 0) / productivityScores.length).toFixed(2))
        : null,
      completed_sessions: completedSessions.length,
      abandoned_sessions: abandonedSessions.length
    };
  }

  async calculateTrends(userId, sessions) {
    const focusScoreTrend = sessions
      .filter(s => s.focus_score !== null)
      .map(s => parseFloat(s.focus_score));

    const dailySessions = {};
    sessions.forEach(session => {
      const date = new Date(session.start_time).toISOString().split('T')[0];
      if (!dailySessions[date]) {
        dailySessions[date] = {
          count: 0,
          total_focus_score: 0,
          focus_score_count: 0
        };
      }
      dailySessions[date].count++;
      if (session.focus_score !== null) {
        dailySessions[date].total_focus_score += parseFloat(session.focus_score);
        dailySessions[date].focus_score_count++;
      }
    });

    const dailySessionsArray = Object.entries(dailySessions).map(([date, data]) => ({
      date,
      count: data.count,
      avg_score: data.focus_score_count > 0
        ? parseFloat((data.total_focus_score / data.focus_score_count).toFixed(2))
        : null
    }));

    return {
      focus_score_trend: focusScoreTrend,
      daily_sessions: dailySessionsArray
    };
  }

  groupBySubject(sessions) {
    const bySubject = {};

    sessions.forEach(session => {
      const subject = session.subject || 'Other';
      
      if (!bySubject[subject]) {
        bySubject[subject] = {
          sessions: 0,
          total_focus_score: 0,
          focus_score_count: 0
        };
      }

      bySubject[subject].sessions++;
      if (session.focus_score !== null) {
        bySubject[subject].total_focus_score += parseFloat(session.focus_score);
        bySubject[subject].focus_score_count++;
      }
    });

    const result = {};
    Object.entries(bySubject).forEach(([subject, data]) => {
      result[subject] = {
        sessions: data.sessions,
        avg_score: data.focus_score_count > 0
          ? parseFloat((data.total_focus_score / data.focus_score_count).toFixed(2))
          : null
      };
    });

    return result;
  }

  calculateBestTimeOfDay(sessions) {
    const timeOfDay = {
      morning: { sessions: 0, total_score: 0, count: 0 },
      afternoon: { sessions: 0, total_score: 0, count: 0 },
      evening: { sessions: 0, total_score: 0, count: 0 },
      night: { sessions: 0, total_score: 0, count: 0 }
    };

    sessions.forEach(session => {
      const hour = new Date(session.start_time).getHours();
      let period;

      if (hour >= 5 && hour < 12) period = 'morning';
      else if (hour >= 12 && hour < 17) period = 'afternoon';
      else if (hour >= 17 && hour < 21) period = 'evening';
      else period = 'night';

      timeOfDay[period].sessions++;
      if (session.focus_score !== null) {
        timeOfDay[period].total_score += parseFloat(session.focus_score);
        timeOfDay[period].count++;
      }
    });

    const result = {};
    Object.entries(timeOfDay).forEach(([period, data]) => {
      result[period] = data.count > 0
        ? parseFloat((data.total_score / data.count).toFixed(2))
        : null;
    });

    return result;
  }

  async getCommonDistractions(userId, dateRange) {
    try {
      const sessions = await FocusSession.findAll({
        where: {
          user_id: userId,
          start_time: {
            [Op.between]: [dateRange.start, dateRange.end]
          }
        },
        attributes: ['id']
      });

      const sessionIds = sessions.map(s => s.id);

      if (sessionIds.length === 0) {
        return [];
      }

      const distractionEvents = await FocusSessionEvent.findAll({
        where: {
          session_id: {
            [Op.in]: sessionIds
          },
          event_type: 'distraction_detected'
        }
      });

      const distractionMap = {};
      distractionEvents.forEach(event => {
        const app = event.event_data.app_name;
        if (!distractionMap[app]) {
          distractionMap[app] = { count: 0 };
        }
        distractionMap[app].count++;
      });

      return Object.entries(distractionMap)
        .map(([app, data]) => ({ app, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (error) {
      logger.error('Error getting common distractions:', error);
      return [];
    }
  }

  groupActivitiesByApp(activities) {
    const appMap = {};

    activities.forEach(activity => {
      const app = activity.app_name;
      if (!appMap[app]) {
        appMap[app] = { total_time: 0, count: 0 };
      }
      appMap[app].total_time += parseFloat(activity.duration || 0);
      appMap[app].count++;
    });

    return Object.entries(appMap)
      .map(([app, data]) => ({
        app,
        time: Math.round(data.total_time),
        count: data.count
      }))
      .sort((a, b) => b.time - a.time);
  }

  extractAIInsights(screenshots) {
    if (screenshots.length === 0) {
      return {
        attention_pattern: 'unknown',
        most_focused_period: null,
        recommendations: []
      };
    }

    const attentionLevels = [];
    screenshots.forEach(screenshot => {
      if (screenshot.ai_analysis && screenshot.ai_analysis.attention_level) {
        attentionLevels.push({
          level: screenshot.ai_analysis.attention_level,
          time: screenshot.created_at
        });
      }
    });

    const highAttentionCount = attentionLevels.filter(a => a.level === 'high').length;
    const totalCount = attentionLevels.length;

    const attentionPattern = totalCount > 0
      ? highAttentionCount / totalCount > 0.6 ? 'high' : highAttentionCount / totalCount > 0.3 ? 'medium' : 'low'
      : 'unknown';

    return {
      attention_pattern: attentionPattern,
      most_focused_period: attentionLevels.length > 0 ? 'Mid-session' : null,
      recommendations: this.generateAIRecommendations(attentionPattern)
    };
  }

  generateAIRecommendations(attentionPattern) {
    switch (attentionPattern) {
      case 'high':
        return ['Great focus! Keep up the good work.', 'Consider taking regular breaks to maintain this level.'];
      case 'medium':
        return ['Try eliminating distractions during your next session.', 'Consider shorter, more focused sessions.'];
      case 'low':
        return ['Consider blocking distracting apps/websites.', 'Try the Pomodoro technique (25-minute sessions).'];
      default:
        return ['Track more sessions to get personalized insights.'];
    }
  }

  findOptimalDuration(sessions) {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    if (completedSessions.length === 0) return 25;

    const avgDuration = completedSessions.reduce((sum, s) => sum + s.planned_duration, 0) / completedSessions.length;
    
    // Round to nearest 5
    return Math.round(avgDuration / 5) * 5;
  }

  findBestTimeOfDay(sessions) {
    const timeScores = this.calculateBestTimeOfDay(sessions);
    
    let bestTime = 'morning';
    let bestScore = 0;

    Object.entries(timeScores).forEach(([time, score]) => {
      if (score !== null && score > bestScore) {
        bestScore = score;
        bestTime = time;
      }
    });

    const timeRanges = {
      morning: '05:00-12:00',
      afternoon: '12:00-17:00',
      evening: '17:00-21:00',
      night: '21:00-05:00'
    };

    return timeRanges[bestTime] || 'No data';
  }

  suggestBreakPattern(sessions) {
    const avgDuration = this.findOptimalDuration(sessions);
    
    if (avgDuration <= 25) {
      return 'Every 25 minutes (Pomodoro technique)';
    } else if (avgDuration <= 45) {
      return 'Every 45 minutes';
    } else {
      return 'Every 50-60 minutes';
    }
  }

  generateImprovementAreas(sessions) {
    const areas = [];
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const abandonedSessions = sessions.filter(s => s.status === 'abandoned');

    // Completion rate
    const completionRate = sessions.length > 0
      ? (completedSessions.length / sessions.length) * 100
      : 0;

    if (completionRate < 70) {
      areas.push(`You complete ${completionRate.toFixed(0)}% of sessions. Try shorter sessions to improve completion rate.`);
    }

    // Focus score analysis
    const avgFocusScore = completedSessions
      .filter(s => s.focus_score !== null)
      .reduce((sum, s) => sum + parseFloat(s.focus_score), 0) / completedSessions.length;

    if (avgFocusScore < 60) {
      areas.push('Your average focus score is low. Consider blocking distracting apps during sessions.');
    }

    // Time of day analysis
    const timeScores = this.calculateBestTimeOfDay(sessions);
    const bestTime = Object.entries(timeScores)
      .filter(([_, score]) => score !== null)
      .sort((a, b) => b[1] - a[1])[0];

    if (bestTime) {
      areas.push(`Your focus is highest during ${bestTime[0]} hours. Schedule important work then.`);
    }

    if (areas.length === 0) {
      areas.push('Great job! Keep tracking your focus sessions for more insights.');
    }

    return areas;
  }
}

export default new FocusAnalyticsService();

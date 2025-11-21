import { Activity, Screenshot, Keystroke, SystemMetric, User, sequelize } from '../models/index.js';
import logger from '../utils/logger.js';
import { Op, fn, col, literal } from 'sequelize';

// Helper function to get userId - uses authenticated user or user with most data
const getUserId = async (req) => {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  
  // When unauthenticated, find user with the most activities
  const userWithActivities = await Activity.findOne({
    attributes: [
      'userId',
      [fn('COUNT', col('id')), 'activity_count']
    ],
    group: ['userId'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    raw: true
  });
  
  if (userWithActivities && userWithActivities.userId) {
    return userWithActivities.userId;
  }
  
  // Fallback to first user
  const firstUser = await User.findOne({ order: [['created_at', 'ASC']] });
  return firstUser ? firstUser.id : null;
};

// Get dashboard summary
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        data: {
          today_activities: [],
          today_vs_yesterday: { change: 0, trend: 'neutral' },
          screenshots: { today: 0, change: 0 },
          keystrokes: { today: 0, change: 0 },
          productivity_score: 0,
          active_hours: 0,
          most_used_app: 'N/A',
          most_visited_website: 'N/A'
        }
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get today's activities
    const todayActivities = await Activity.findAll({
      where: {
        userId: userId,
        start_time: {
          [Op.gte]: today
        }
      },
      attributes: [
        'activity_type',
        [fn('SUM', col('duration')), 'total_duration']
      ],
      group: ['activity_type'],
      raw: true
    });
    
    // Get yesterday's activities for comparison
    const yesterdayActivities = await Activity.findAll({
      where: {
        userId: userId,
        start_time: {
          [Op.gte]: yesterday,
          [Op.lt]: today
        }
      },
      attributes: [
        [fn('SUM', col('duration')), 'total_duration']
      ],
      raw: true
    });
    
    // Get today's screenshots count
    const todayScreenshots = await Screenshot.count({
      where: {
        userId,
        created_at: {
          [Op.gte]: today
        }
      }
    });
    
    // Get system metrics summary for today
    const metrics = await SystemMetric.findAll({
      where: {
        userId: userId,
        created_at: {
          [Op.gte]: today
        }
      },
      attributes: [
        [fn('AVG', col('cpu_usage')), 'avg_cpu_usage'],
        [fn('AVG', col('memory_usage')), 'avg_memory_usage'],
        [fn('AVG', col('disk_usage')), 'avg_disk_usage']
      ],
      raw: true
    });
    
    // Calculate productivity score (simplified example)
    const productiveTime = todayActivities
      .filter(a => a.activity_type === 'application' || a.activity_type === 'browser')
      .reduce((sum, a) => sum + parseFloat(a.total_duration || 0), 0);
    
    const totalTime = todayActivities
      .reduce((sum, a) => sum + parseFloat(a.total_duration || 0), 0);
    
    const productivityScore = totalTime > 0 
      ? Math.min(100, Math.round((productiveTime / totalTime) * 100))
      : 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalTime: totalTime,
          productiveTime,
          productivityScore,
          screenshotsCount: todayScreenshots,
          ...(metrics[0] || {})
        },
        comparison: {
          yesterday_total_time: parseFloat(yesterdayActivities[0]?.total_duration || 0)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting dashboard summary:', error);
    next(error);
  }
};

// Get activity timeline
export const getActivityTimeline = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        data: {
          timeline: [],
          activity_types: []
        }
      });
    }
    
    const { date = new Date().toISOString().split('T')[0], interval = 'hour' } = req.query;
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    let groupBy;
    let format;
    
    switch (interval) {
      case 'minute':
        groupBy = [
          fn('date_trunc', 'minute', col('start_time')),
          'app_name'
        ];
        format = 'YYYY-MM-DD HH24:MI';
        break;
      case 'day':
        groupBy = [
          fn('date_trunc', 'day', col('start_time')),
          'app_name'
        ];
        format = 'YYYY-MM-DD';
        break;
      case 'hour':
      default:
        groupBy = [
          fn('date_trunc', 'hour', col('start_time')),
          'app_name'
        ];
        format = 'YYYY-MM-DD HH24:00';
    }
    
    const activities = await Activity.findAll({
      where: {
        userId: userId,
        start_time: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      },
      attributes: [
        [fn('to_char', col('start_time'), format), 'time'],
        'app_name',
        [fn('SUM', col('duration')), 'duration']
      ],
      group: [
        fn('to_char', col('start_time'), format),
        'app_name'
      ],
      order: [[fn('to_char', col('start_time'), format), 'ASC']],
      raw: true
    });
    
    // Group by time interval
    const timeline = {};
    activities.forEach(activity => {
      if (!timeline[activity.time]) {
        timeline[activity.time] = [];
      }
      timeline[activity.time].push({
        app_name: activity.app_name,
        duration: parseFloat(activity.duration)
      });
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        timeline,
        activity_types: [...new Set(activities.map(a => a.app_name))]
      }
    });
  } catch (error) {
    logger.error('Error getting activity timeline:', error);
    next(error);
  }
};

// Get top applications
export const getTopApps = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    const { limit = 10, startDate, endDate } = req.query;
    
    const where = { userId: userId };
    
    if (startDate && endDate) {
      where.start_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const topApps = await Activity.findAll({
      where,
      attributes: [
        'app_name',
        [fn('SUM', col('duration')), 'total_duration'],
        [fn('COUNT', col('id')), 'sessions']
      ],
      group: ['app_name'],
      order: [[literal('"total_duration"'), 'DESC']],
      limit: parseInt(limit, 10),
      raw: true
    });
    
    res.status(200).json({
      status: 'success',
      data: topApps.map(app => ({
        ...app,
        total_duration: parseFloat(app.total_duration || 0)
      }))
    });
  } catch (error) {
    logger.error('Error getting top apps:', error);
    next(error);
  }
};

// Get website usage
export const getWebsiteUsage = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    const { limit = 20, startDate, endDate } = req.query;
    
    const where = {
      userId: userId,
      activity_type: 'browser',
      url: {
        [Op.ne]: null,
        [Op.ne]: ''
      }
    };
    
    if (startDate && endDate) {
      where.start_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const websites = await Activity.findAll({
      where,
      attributes: [
        'url',
        [fn('SUM', col('duration')), 'totalDuration'],
        [fn('COUNT', col('id')), 'visits']
      ],
      group: ['url'],
      order: [[literal('"totalDuration"'), 'DESC']],
      limit: parseInt(limit, 10),
      raw: true
    });
    
    // Process URLs to extract domain
    const domainMap = {};
    websites.forEach(site => {
      try {
        const url = new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`);
        const domain = url.hostname.replace('www.', '');
        
        if (!domainMap[domain]) {
          domainMap[domain] = {
            domain,
            total_duration: 0,
            visits: 0
          };
        }
        
        domainMap[domain].total_duration += parseFloat(site.total_duration);
        domainMap[domain].visits += parseInt(site.visits, 10);
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    const result = Object.values(domainMap)
      .sort((a, b) => b.total_duration - a.total_duration)
      .slice(0, limit);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('Error getting website usage:', error);
    next(error);
  }
};

// Get productivity score
export const getProductivityScore = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        data: {
          score: 0,
          productive_time: 0,
          total_time: 0,
          by_category: {},
          by_hour: {}
        }
      });
    }
    
    const { startDate, endDate } = req.query;
    
    const where = { userId: userId };
    
    if (startDate && endDate) {
      where.start_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Get all activities in the date range
    const activities = await Activity.findAll({
      where,
      attributes: ['activity_type', 'app_name', 'duration']
    });
    
    // Categorize activities (simplified example)
    const categories = {
      productive: ['vscode', 'terminal', 'slack', 'chrome', 'firefox', 'safari', 'edge'],
      neutral: ['finder', 'explorer', 'settings', 'system preferences'],
      distracting: ['youtube', 'facebook', 'twitter', 'instagram', 'netflix', 'spotify', 'games']
    };
    
    let productiveTime = 0;
    let neutralTime = 0;
    let distractingTime = 0;
    
    activities.forEach(activity => {
      const app = activity.app_name ? activity.app_name.toLowerCase() : '';
      const duration = parseFloat(activity.duration || 0);
      
      if (categories.productive.some(p => app.includes(p))) {
        productiveTime += duration;
      } else if (categories.distracting.some(d => app.includes(d))) {
        distractingTime += duration;
      } else {
        neutralTime += duration;
      }
    });
    
    const totalTime = productiveTime + neutralTime + distractingTime;
    const productivityScore = totalTime > 0 
      ? Math.min(100, Math.round((productiveTime / totalTime) * 100))
      : 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        score: productivityScore,
        breakdown: {
          productive: productiveTime,
          neutral: neutralTime,
          distracting: distractingTime
        },
        totalTime
      }
    });
  } catch (error) {
    logger.error('Error calculating productivity score:', error);
    next(error);
  }
};

// Get screenshots with pagination
export const getScreenshots = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        data: {
          screenshots: [],
          total: 0,
          page: 1,
          pages: 1
        }
      });
    }
    
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { userId: userId, is_archived: false };
    
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
    
    res.status(200).json({
      status: 'success',
      data: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
        screenshots
      }
    });
  } catch (error) {
    logger.error('Error fetching screenshots:', error);
    next(error);
  }
};

// Generate activity report
export const generateActivityReport = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        data: {
          summary: {
            total_time: 0,
            productive_time: 0,
            unproductive_time: 0,
            neutral_time: 0,
            productivity_score: 0,
            most_used_app: 'N/A',
            most_visited_website: 'N/A'
          },
          by_category: {},
          by_application: [],
          by_website: [],
          by_hour: {}
        }
      });
    }
    
    const { startDate, endDate, format = 'json' } = req.query;
    
    const where = { userId: userId };
    
    if (startDate && endDate) {
      where.start_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Get activity summary
    const activities = await Activity.findAll({
      where,
      attributes: [
        'app_name',
        [fn('SUM', col('duration')), 'totalDuration'],
        [fn('COUNT', col('id')), 'sessions']
      ],
      group: ['app_name'],
      order: [[literal('"totalDuration"'), 'DESC']],
      raw: true
    });
    
    // Get daily activity
    const dailyActivity = await Activity.findAll({
      where,
      attributes: [
        [fn('date_trunc', 'day', col('start_time')), 'date'],
        [fn('SUM', col('duration')), 'totalDuration']
      ],
      group: ['date'],
      order: [['date', 'ASC']],
      raw: true
    });
    
    // Get top websites
    const topWebsites = await Activity.findAll({
      where: {
        ...where,
        activity_type: 'browser',
        url: {
          [Op.ne]: null
        }
      },
      attributes: [
        'url',
        [fn('SUM', col('duration')), 'totalDuration'],
        [fn('COUNT', col('id')), 'visits']
      ],
      group: ['url'],
      order: [[literal('"totalDuration"'), 'DESC']],
      limit: 10,
      raw: true
    });
    
    // Get system metrics summary
    const metrics = await SystemMetric.findAll({
      where,
      attributes: [
        [fn('AVG', col('cpu_usage')), 'avgCpuUsage'],
        [fn('AVG', col('memory_usage')), 'avgMemoryUsage'],
        [fn('AVG', col('disk_usage')), 'avgDiskUsage']
      ],
      raw: true
    });
    
    // Generate report
    const report = {
      summary: {
        totalTime: activities.reduce((sum, a) => sum + parseFloat(a.totalDuration || 0), 0),
        totalSessions: activities.reduce((sum, a) => sum + parseInt(a.sessions || 0, 10), 0),
        uniqueApps: activities.length,
        ...(metrics[0] || {})
      },
      topApps: activities.slice(0, 10).map(a => ({
        appName: a.app_name,
        totalDuration: parseFloat(a.totalDuration),
        sessions: parseInt(a.sessions, 10)
      })),
      dailyActivity: dailyActivity.map(d => ({
        date: d.date,
        totalDuration: parseFloat(d.totalDuration)
      })),
      topWebsites: topWebsites.map(site => ({
        url: site.url,
        totalDuration: parseFloat(site.totalDuration),
        visits: parseInt(site.visits, 10)
      }))
    };
    
    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    logger.error('Error generating activity report:', error);
    next(error);
  }
};

import { faker } from '@faker-js/faker';

// Generate mock data for the dashboard
export const getDashboardSummary = async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Generate mock activities for today
  const todayActivities = [
    { activity_type: 'productive', duration: faker.number.int({ min: 2, max: 6 }) * 3600 },
    { activity_type: 'unproductive', duration: faker.number.int({ min: 1, max: 3 }) * 3600 },
    { activity_type: 'neutral', duration: faker.number.int({ min: 0, max: 2 }) * 3600 }
  ];

  // Generate mock data for the dashboard
  const dashboardData = {
    today_activities: todayActivities.map(act => ({
      ...act,
      percentage: Math.round((act.duration / (24 * 3600)) * 100)
    })),
    today_vs_yesterday: {
      change: faker.number.int({ min: -20, max: 20 }),
      trend: faker.helpers.arrayElement(['up', 'down', 'neutral'])
    },
    screenshots: {
      today: faker.number.int({ min: 5, max: 50 }),
      change: faker.number.int({ min: -30, max: 30 })
    },
    keystrokes: {
      today: faker.number.int({ min: 1000, max: 10000 }),
      change: faker.number.int({ min: -15, max: 15 })
    },
    productivity_score: faker.number.int({ min: 40, max: 90 }),
    active_hours: faker.number.float({ min: 2, max: 12, precision: 0.5 }),
    most_used_app: faker.helpers.arrayElement(['Visual Studio Code', 'Google Chrome', 'Terminal', 'Slack']),
    most_visited_website: faker.helpers.arrayElement(['github.com', 'google.com', 'stackoverflow.com', 'youtube.com'])
  };

  res.status(200).json({
    status: 'success',
    data: dashboardData
  });
};

// Generate mock activity timeline
export const getActivityTimeline = async (req, res) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const activityTypes = ['coding', 'browsing', 'meeting', 'email', 'other'];
  
  const timeline = hours.map(hour => {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const activities = activityTypes.map(type => ({
      type,
      duration: faker.number.int({ min: 5, max: 60 })
    }));
    
    return {
      time,
      activities
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      timeline,
      activity_types: activityTypes
    }
  });
};

// Generate mock top applications
export const getTopApps = async (req, res) => {
  const apps = [
    { name: 'Visual Studio Code', duration: faker.number.int({ min: 5, max: 15 }) * 3600, sessions: faker.number.int({ min: 5, max: 20 }) },
    { name: 'Google Chrome', duration: faker.number.int({ min: 3, max: 10 }) * 3600, sessions: faker.number.int({ min: 10, max: 30 }) },
    { name: 'Terminal', duration: faker.number.int({ min: 2, max: 8 }) * 3600, sessions: faker.number.int({ min: 5, max: 20 }) },
    { name: 'Slack', duration: faker.number.int({ min: 1, max: 5 }) * 3600, sessions: faker.number.int({ min: 20, max: 50 }) },
    { name: 'Spotify', duration: faker.number.int({ min: 1, max: 4 }) * 3600, sessions: faker.number.int({ min: 1, max: 5 }) }
  ];

  res.status(200).json({
    status: 'success',
    data: apps
  });
};

// Generate mock website usage
export const getWebsiteUsage = async (req, res) => {
  const websites = [
    { domain: 'github.com', duration: faker.number.int({ min: 3, max: 10 }) * 3600, visits: faker.number.int({ min: 20, max: 100 }) },
    { domain: 'google.com', duration: faker.number.int({ min: 1, max: 5 }) * 3600, visits: faker.number.int({ min: 10, max: 50 }) },
    { domain: 'stackoverflow.com', duration: faker.number.int({ min: 1, max: 4 }) * 3600, visits: faker.number.int({ min: 5, max: 30 }) },
    { domain: 'youtube.com', duration: faker.number.int({ min: 2, max: 8 }) * 3600, visits: faker.number.int({ min: 5, max: 20 }) },
    { domain: 'linkedin.com', duration: faker.number.int({ min: 0.5, max: 2 }) * 3600, visits: faker.number.int({ min: 1, max: 10 }) }
  ];

  res.status(200).json({
    status: 'success',
    data: websites
  });
};

// Generate mock productivity score
export const getProductivityScore = async (req, res) => {
  const hours = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const score = hours.map(date => ({
    date,
    score: faker.number.int({ min: 40, max: 95 })
  }));

  const byCategory = {
    coding: faker.number.int({ min: 10, max: 40 }),
    browsing: faker.number.int({ min: 5, max: 30 }),
    meeting: faker.number.int({ min: 0, max: 20 }),
    other: faker.number.int({ min: 5, max: 25 })
  };

  const byHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    score: faker.number.int({ min: 20, max: 90 })
  }));

  res.status(200).json({
    status: 'success',
    data: {
      score: faker.number.int({ min: 60, max: 90 }),
      productive_time: faker.number.int({ min: 4, max: 10 }) * 3600,
      total_time: 16 * 3600,
      by_category: byCategory,
      by_hour: byHour
    }
  });
};

// Generate mock screenshots
export const getScreenshots = async (req, res) => {
  const screenshots = Array.from({ length: 10 }, (_, i) => ({
    id: faker.string.uuid(),
    file_path: `/uploads/screenshots/screenshot-${i + 1}.png`,
    thumbnail_path: `/uploads/thumbnails/thumb-${i + 1}.jpg`,
    created_at: faker.date.recent({ days: 7 }).toISOString(),
    metadata: {
      window_title: faker.lorem.words(3),
      app_name: faker.helpers.arrayElement(['Visual Studio Code', 'Google Chrome', 'Terminal', 'Slack']),
      url: `https://${faker.internet.domainName()}`
    }
  }));

  res.status(200).json({
    status: 'success',
    data: {
      screenshots,
      total: screenshots.length,
      page: 1,
      pages: 1
    }
  });
};

// Generate mock activity report
export const generateActivityReport = async (req, res) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Generate dates for the past week
  const dates = [];
  for (let d = new Date(oneWeekAgo); d <= now; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  
  // Generate mock activities
  const activities = dates.flatMap(date => {
    const count = faker.number.int({ min: 5, max: 20 });
    return Array.from({ length: count }, (_, i) => ({
      id: faker.string.uuid(),
      window_title: faker.lorem.words(3),
      app_name: faker.helpers.arrayElement(['Visual Studio Code', 'Google Chrome', 'Terminal', 'Slack', 'Spotify']),
      start_time: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        faker.number.int({ min: 8, max: 20 }),
        faker.number.int({ min: 0, max: 59 })
      ).toISOString(),
      duration: faker.number.int({ min: 60, max: 3600 }),
      activity_type: faker.helpers.arrayElement(['coding', 'browsing', 'meeting', 'email', 'other']),
      url: faker.datatype.boolean() ? `https://${faker.internet.domainName()}` : null
    }));
  });
  
  // Calculate summary
  const totalTime = activities.reduce((sum, act) => sum + act.duration, 0);
  const productiveTime = activities
    .filter(act => ['coding', 'meeting'].includes(act.activity_type))
    .reduce((sum, act) => sum + act.duration, 0);
  
  const byCategory = activities.reduce((acc, act) => {
    acc[act.activity_type] = (acc[act.activity_type] || 0) + act.duration;
    return acc;
  }, {});
  
  // Generate report
  const report = {
    summary: {
      total_time: totalTime,
      productive_time: productiveTime,
      unproductive_time: totalTime - productiveTime,
      productivity_score: Math.round((productiveTime / totalTime) * 100) || 0,
      most_used_app: faker.helpers.arrayElement(['Visual Studio Code', 'Google Chrome', 'Terminal']),
      most_visited_website: faker.helpers.arrayElement(['github.com', 'google.com', 'stackoverflow.com'])
    },
    by_category: byCategory,
    by_application: Object.entries(
      activities.reduce((acc, act) => {
        acc[act.app_name] = (acc[act.app_name] || 0) + act.duration;
        return acc;
      }, {})
    ).map(([name, duration]) => ({ name, duration })),
    by_website: Object.entries(
      activities
        .filter(act => act.url)
        .reduce((acc, act) => {
          const domain = act.url ? new URL(act.url).hostname.replace('www.', '') : 'unknown';
          acc[domain] = (acc[domain] || 0) + act.duration;
          return acc;
        }, {})
    ).map(([domain, duration]) => ({ domain, duration }))
  };
  
  res.status(200).json({
    status: 'success',
    data: report
  });
};

import { Activity, sequelize } from '../models/index.js';
import logger from '../utils/logger.js';

const USER_ID = '6e145638-7056-4f1a-896e-cf8355631ac1';

// App configurations - same as before
const APPS = {
  productive: [
    { name: 'VS Code', type: 'application', windows: ['index.js', 'app.js', 'package.json', 'README.md', 'server.js'] },
    { name: 'Chrome', type: 'browser', windows: ['GitHub', 'Stack Overflow', 'MDN Web Docs', 'Google Docs', 'Gmail'] },
    { name: 'Terminal', type: 'application', windows: ['Terminal', 'iTerm', 'Command Prompt'] },
    { name: 'Slack', type: 'application', windows: ['Slack - Team Chat', 'Slack - General'] },
    { name: 'Firefox', type: 'browser', windows: ['Firefox', 'Developer Tools'] },
    { name: 'Safari', type: 'browser', windows: ['Safari', 'Web Development'] }
  ],
  distracting: [
    { name: 'YouTube', type: 'browser', windows: ['YouTube - Watch', 'YouTube - Home', 'YouTube - Trending'] },
    { name: 'Facebook', type: 'browser', windows: ['Facebook', 'Facebook - Feed', 'Facebook - Messages'] },
    { name: 'Twitter', type: 'browser', windows: ['Twitter', 'Twitter - Home', 'Twitter - Explore'] },
    { name: 'Instagram', type: 'browser', windows: ['Instagram', 'Instagram - Explore', 'Instagram - Stories'] },
    { name: 'Netflix', type: 'application', windows: ['Netflix', 'Netflix - Watch', 'Netflix - Browse'] },
    { name: 'Spotify', type: 'application', windows: ['Spotify', 'Spotify - Playlist', 'Spotify - Discover'] },
    { name: 'TikTok', type: 'browser', windows: ['TikTok', 'TikTok - For You'] },
    { name: 'Snapchat', type: 'application', windows: ['Snapchat', 'Snapchat - Stories'] }
  ],
  neutral: [
    { name: 'Finder', type: 'system', windows: ['Finder', 'Documents', 'Downloads'] },
    { name: 'Settings', type: 'system', windows: ['System Settings', 'Preferences'] },
    { name: 'Notes', type: 'application', windows: ['Notes', 'My Notes'] },
    { name: 'Calculator', type: 'application', windows: ['Calculator'] }
  ]
};

// URLs for browser activities
const URLS = {
  productive: [
    'https://github.com',
    'https://stackoverflow.com',
    'https://developer.mozilla.org',
    'https://docs.google.com',
    'https://gmail.com',
    'https://code.visualstudio.com'
  ],
  distracting: [
    'https://youtube.com/watch?v=',
    'https://www.youtube.com/watch?v=',
    'https://facebook.com',
    'https://twitter.com',
    'https://instagram.com',
    'https://netflix.com',
    'https://open.spotify.com',
    'https://tiktok.com',
    'https://snapchat.com'
  ]
};

/**
 * Generate random date within a range
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Get random item from array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate realistic activity duration (in seconds)
 * For high distraction user, distracting activities are longer
 */
function generateDuration(category) {
  if (category === 'distracting') {
    // Distracting activities are longer for this user (5 minutes to 2 hours)
    return Math.floor(Math.random() * 7200) + 300; // 5 minutes to 2 hours
  } else if (category === 'productive') {
    // Productive activities are shorter (1 minute to 30 minutes)
    return Math.floor(Math.random() * 1800) + 60; // 1 minute to 30 minutes
  } else {
    return Math.floor(Math.random() * 600) + 30; // 30 seconds to 10 minutes
  }
}

/**
 * Generate activity records with high distraction ratio
 */
async function generateActivities(userId, count = 100) {
  try {
    logger.info(`Generating ${count} activity records with HIGH DISTRACTION for user ${userId}...`);

    // Generate activities over the last 14 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    const activities = [];
    let currentTime = new Date(startDate);

    // Distribute activities with HIGH distraction ratio
    // 70% distracting, 20% productive, 10% neutral
    for (let i = 0; i < count; i++) {
      // Determine category based on desired distribution
      const rand = Math.random();
      let category, appConfig;
      
      if (rand < 0.7) {
        // 70% distracting
        category = 'distracting';
        appConfig = randomItem(APPS.distracting);
      } else if (rand < 0.9) {
        // 20% productive
        category = 'productive';
        appConfig = randomItem(APPS.productive);
      } else {
        // 10% neutral
        category = 'neutral';
        appConfig = randomItem(APPS.neutral);
      }

      // Generate start time (more activities during 9 AM - 11 PM)
      const hour = Math.random() < 0.8 
        ? Math.floor(Math.random() * 14) + 9  // 9 AM to 11 PM (80% chance)
        : Math.floor(Math.random() * 24);      // Any hour (20% chance)
      
      currentTime = randomDate(startDate, endDate);
      currentTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

      const duration = generateDuration(category);
      const startTime = new Date(currentTime);
      const endTime = new Date(startTime.getTime() + duration * 1000);

      // Generate window title
      const windowTitle = appConfig.windows 
        ? `${randomItem(appConfig.windows)} - ${appConfig.name}`
        : appConfig.name;

      // Generate URL for browser activities
      let url = null;
      if (appConfig.type === 'browser') {
        const urlList = category === 'productive' ? URLS.productive : URLS.distracting;
        url = randomItem(urlList);
        if (url.includes('watch?v=')) {
          url += Math.random().toString(36).substring(7); // Random video ID
        }
      }

      activities.push({
        user_id: userId,
        window_title: windowTitle,
        app_name: appConfig.name,
        url: url,
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        activity_type: appConfig.type,
        is_active: true,
        created_at: startTime,
        updated_at: startTime
      });

      // Move time forward slightly to avoid exact overlaps
      currentTime = new Date(endTime.getTime() + Math.random() * 60000); // 0-1 minute gap
    }

    // Sort by start_time
    activities.sort((a, b) => a.start_time - b.start_time);

    // Insert activities in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < activities.length; i += batchSize) {
      const batch = activities.slice(i, i + batchSize);
      await Activity.bulkCreate(batch, { ignoreDuplicates: true });
      inserted += batch.length;
      logger.info(`Inserted ${inserted}/${activities.length} activities...`);
    }

    logger.info(`✅ Successfully generated ${inserted} activity records for user ${userId}`);

    // Print summary
    const productiveCount = activities.filter(a => 
      APPS.productive.some(p => p.name === a.app_name)
    ).length;
    const distractingCount = activities.filter(a => 
      APPS.distracting.some(d => d.name === a.app_name)
    ).length;
    const neutralCount = activities.filter(a => 
      APPS.neutral.some(n => n.name === a.app_name)
    ).length;

    const productiveTime = activities
      .filter(a => APPS.productive.some(p => p.name === a.app_name))
      .reduce((sum, a) => sum + a.duration, 0);
    const distractingTime = activities
      .filter(a => APPS.distracting.some(d => d.name === a.app_name))
      .reduce((sum, a) => sum + a.duration, 0);
    const neutralTime = activities
      .filter(a => APPS.neutral.some(n => n.name === a.app_name))
      .reduce((sum, a) => sum + a.duration, 0);

    console.log('\n📊 Activity Summary (HIGH DISTRACTION USER):');
    console.log(`   Productive: ${productiveCount} (${((productiveCount/count)*100).toFixed(1)}%) - ${(productiveTime/3600).toFixed(2)} hours`);
    console.log(`   Distracting: ${distractingCount} (${((distractingCount/count)*100).toFixed(1)}%) - ${(distractingTime/3600).toFixed(2)} hours`);
    console.log(`   Neutral: ${neutralCount} (${((neutralCount/count)*100).toFixed(1)}%) - ${(neutralTime/3600).toFixed(2)} hours`);
    console.log(`   Total Duration: ${((productiveTime + distractingTime + neutralTime) / 3600).toFixed(2)} hours`);
    console.log(`   Productivity Ratio: ${((productiveTime / (productiveTime + distractingTime + neutralTime)) * 100).toFixed(1)}%`);

    return inserted;

  } catch (error) {
    logger.error('Error generating activities:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    const count = 100; // Generate 100 activities
    await generateActivities(USER_ID, count);

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();

export { generateActivities };

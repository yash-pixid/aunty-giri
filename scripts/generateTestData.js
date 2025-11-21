import { Activity, Screenshot, Keystroke, SystemMetric, User, sequelize } from '../models/index.js';
import { faker } from '@faker-js/faker';
import { Op } from 'sequelize';

// Helper function to generate random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Common applications and websites
const APPS = [
  'Google Chrome', 'Visual Studio Code', 'Terminal', 'Postman', 'Slack',
  'Microsoft Word', 'Microsoft Excel', 'Spotify', 'Discord', 'Zoom'
];

const WEBSITES = [
  'google.com', 'github.com', 'stackoverflow.com', 'youtube.com', 'linkedin.com',
  'twitter.com', 'facebook.com', 'instagram.com', 'reddit.com', 'wikipedia.org'
];

// Activity types
const ACTIVITY_TYPES = ['application', 'browser', 'document', 'meeting', 'other'];

// Generate test activities
async function generateActivities(userId, count = 100) {
  const activities = [];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const startTime = randomDate(oneWeekAgo, now);
    const endTime = new Date(startTime.getTime() + Math.random() * 2 * 60 * 60 * 1000); // Up to 2 hours
    
    const isBrowser = Math.random() > 0.5;
    const appName = isBrowser 
      ? 'Google Chrome' 
      : APPS[Math.floor(Math.random() * APPS.length)];
    
    const url = isBrowser && Math.random() > 0.3 
      ? `https://${WEBSITES[Math.floor(Math.random() * WEBSITES.length)]}` 
      : null;
    
    activities.push({
      userId: userId,
      window_title: isBrowser 
        ? `${faker.lorem.words(3)} - ${appName}`
        : `${faker.lorem.words(2)} - ${appName}`,
      app_name: appName,
      start_time: startTime,
      end_time: endTime,
      duration: Math.round((endTime - startTime) / 1000), // in seconds
      activity_type: isBrowser ? 'browser' : ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)],
      url: url,
      metadata: {}
    });
  }
  
  return Activity.bulkCreate(activities);
}

// Generate test screenshots
async function generateScreenshots(userId, count = 20) {
  const screenshots = [];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const createdAt = randomDate(oneWeekAgo, now);
    screenshots.push({
      userId: userId,
      file_path: `/uploads/screenshots/screenshot-${Date.now()}-${i}.png`,
      file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB to 5MB
      width: 1920,
      height: 1080,
      format: 'webp',
      created_at: createdAt,
      metadata: {
        window_title: faker.lorem.words(3),
        app_name: APPS[Math.floor(Math.random() * APPS.length)],
        url: Math.random() > 0.5 ? `https://${WEBSITES[Math.floor(Math.random() * WEBSITES.length)]}` : null
      }
    });
  }
  
  return Screenshot.bulkCreate(screenshots);
}

// Generate test keystrokes
async function generateKeystrokes(userId, count = 50) {
  const keystrokes = [];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate(oneWeekAgo, now);
    const key = faker.lorem.word().charAt(0);
    keystrokes.push({
      userId: userId,
      key_code: key.charCodeAt(0),
      key_char: key,
      key_type: 'alphanumeric',
      timestamp: timestamp,
      window_title: faker.lorem.words(3),
      app_name: APPS[Math.floor(Math.random() * APPS.length)],
      is_shortcut: false,
      modifiers: []
    });
  }
  
  return Keystroke.bulkCreate(keystrokes);
}

// Generate system metrics
async function generateSystemMetrics(userId, count = 200) {
  const metrics = [];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate(oneWeekAgo, now);
    const cpuUsage = Math.random() * 100;
    const memoryUsage = 30 + Math.random() * 70;
    const diskUsage = 10 + Math.random() * 50;
    const networkIn = Math.random() * 1024 * 1024;
    const networkOut = Math.random() * 1024 * 1024;
    const cpuTemp = 50 + Math.random() * 30;
    const diskRead = Math.random() * 100;
    const diskWrite = Math.random() * 100;
    
    metrics.push({
      userId: userId,
      cpu_usage: cpuUsage,
      memory_usage: memoryUsage,
      disk_usage: diskUsage,
      network_in: networkIn,
      network_out: networkOut,
      cpu_temperature: cpuTemp,
      disk_read: diskRead,
      disk_write: diskWrite,
      timestamp: timestamp,
      created_at: timestamp,
      metrics: {
        cpu: { usage: cpuUsage, temperature: cpuTemp },
        memory: { usage: memoryUsage },
        disk: { usage: diskUsage, read: diskRead, write: diskWrite },
        network: { in: networkIn, out: networkOut }
      }
    });
  }
  
  return SystemMetric.bulkCreate(metrics, { ignoreDuplicates: true });
}

// Function to get or create a test user
async function getOrCreateTestUser() {
  try {
    // Try to find the first user in the database
    const user = await User.findOne();
    if (user) {
      return user.id;
    }
    
    // If no users exist, create a test user
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      is_active: true,
      role: 'student'
    });
    
    return testUser.id;
  } catch (error) {
    console.error('Error getting or creating test user:', error);
    throw error;
  }
}

// Main function to generate all test data
async function generateTestData() {
  try {
    // Get or create a test user
    const userId = await getOrCreateTestUser();
    console.log('Using user ID:', userId);
    
    console.log('Generating test data...');
    
    // Clear existing test data
    await Promise.all([
      Activity.destroy({ where: { userId: userId } }),
      Screenshot.destroy({ where: { userId: userId } }),
      Keystroke.destroy({ where: { userId: userId } }),
      SystemMetric.destroy({ where: { userId: userId } })
    ]);
    
    // Generate new test data
    await Promise.all([
      generateActivities(userId, 200),
      generateScreenshots(userId, 30),
      generateKeystrokes(userId, 100),
      generateSystemMetrics(userId, 500)
    ]);
    
    console.log('Test data generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  }
}

// Run the script
generateTestData();

import { Activity, Screenshot, Keystroke, SystemMetric, User, sequelize } from './models/index.js';
import { Op } from 'sequelize';

async function checkDatabaseData() {
  try {
    console.log('📊 Checking Database Data...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');
    
    // Count records in each table
    const userCount = await User.count();
    const activityCount = await Activity.count();
    const screenshotCount = await Screenshot.count();
    const keystrokeCount = await Keystroke.count();
    const metricCount = await SystemMetric.count();
    
    console.log('═══════════════════════════════════════════════');
    console.log('           DATABASE DATA SUMMARY');
    console.log('═══════════════════════════════════════════════\n');
    console.log(`👤 Users:           ${userCount}`);
    console.log(`📱 Activities:      ${activityCount}`);
    console.log(`📸 Screenshots:     ${screenshotCount}`);
    console.log(`⌨️  Keystrokes:      ${keystrokeCount}`);
    console.log(`📈 System Metrics:  ${metricCount}\n`);
    
    // Check date ranges for time-series data
    if (activityCount > 0) {
      const oldestActivity = await Activity.findOne({
        order: [['start_time', 'ASC']],
        attributes: ['start_time']
      });
      const newestActivity = await Activity.findOne({
        order: [['start_time', 'DESC']],
        attributes: ['start_time']
      });
      
      console.log('📅 Activity Date Range:');
      console.log(`   Oldest: ${oldestActivity.start_time}`);
      console.log(`   Newest: ${newestActivity.start_time}`);
      console.log(`   Days of data: ${Math.ceil((newestActivity.start_time - oldestActivity.start_time) / (1000 * 60 * 60 * 24))}\n`);
    }
    
    if (metricCount > 0) {
      const oldestMetric = await SystemMetric.findOne({
        order: [['created_at', 'ASC']],
        attributes: ['created_at']
      });
      const newestMetric = await SystemMetric.findOne({
        order: [['created_at', 'DESC']],
        attributes: ['created_at']
      });
      
      console.log('📅 Metrics Date Range:');
      console.log(`   Oldest: ${oldestMetric.created_at}`);
      console.log(`   Newest: ${newestMetric.created_at}`);
      console.log(`   Days of data: ${Math.ceil((newestMetric.created_at - oldestMetric.created_at) / (1000 * 60 * 60 * 24))}\n`);
    }
    
    // Get activity breakdown
    if (activityCount > 0) {
      const activityByType = await Activity.findAll({
        attributes: [
          'activity_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('duration')), 'total_duration']
        ],
        group: ['activity_type'],
        raw: true
      });
      
      console.log('📊 Activity Breakdown by Type:');
      activityByType.forEach(item => {
        console.log(`   ${item.activity_type}: ${item.count} activities, ${Math.round(item.total_duration / 3600)} hours`);
      });
      console.log('');
      
      // Top apps
      const topApps = await Activity.findAll({
        attributes: [
          'app_name',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('duration')), 'total_duration']
        ],
        group: ['app_name'],
        order: [[sequelize.literal('total_duration'), 'DESC']],
        limit: 5,
        raw: true
      });
      
      console.log('🏆 Top 5 Apps by Usage:');
      topApps.forEach((app, index) => {
        console.log(`   ${index + 1}. ${app.app_name}: ${Math.round(app.total_duration / 3600)} hours`);
      });
      console.log('');
    }
    
    // Check if we have enough data for dashboard
    console.log('═══════════════════════════════════════════════');
    console.log('           DASHBOARD READINESS');
    console.log('═══════════════════════════════════════════════\n');
    
    const hasEnoughData = activityCount >= 50 && metricCount >= 100;
    const recommendations = [];
    
    if (activityCount < 50) {
      recommendations.push(`⚠️  Need more activities (current: ${activityCount}, recommended: 50+)`);
    } else {
      console.log(`✅ Activities: ${activityCount} (sufficient for analytics)`);
    }
    
    if (metricCount < 100) {
      recommendations.push(`⚠️  Need more system metrics (current: ${metricCount}, recommended: 100+)`);
    } else {
      console.log(`✅ System Metrics: ${metricCount} (sufficient for analytics)`);
    }
    
    if (screenshotCount > 0) {
      console.log(`✅ Screenshots: ${screenshotCount} (present)`);
    } else {
      recommendations.push(`ℹ️  No screenshots (optional for basic dashboard)`);
    }
    
    if (keystrokeCount > 0) {
      console.log(`✅ Keystrokes: ${keystrokeCount} (present)`);
    } else {
      recommendations.push(`ℹ️  No keystrokes (optional for basic dashboard)`);
    }
    
    if (recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    if (hasEnoughData) {
      console.log('\n🎉 Dashboard is ready for analytics!');
    } else {
      console.log('\n⚠️  Dashboard needs more data for meaningful analytics.');
      console.log('   Run: node scripts/generateTestData.js');
    }
    
    console.log('\n═══════════════════════════════════════════════\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabaseData();


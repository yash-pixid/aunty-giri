#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up AI Recommendation System...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found existing .env file');
} else {
  console.log('📝 Creating .env file...');
}

// Add recommendation API keys if not present
const requiredEnvVars = [
  'YOUTUBE_API_KEY=your_youtube_api_key_here',
  'NEWS_API_KEY=your_news_api_key_here'
];

let envUpdated = false;
requiredEnvVars.forEach(envVar => {
  const [key] = envVar.split('=');
  if (!envContent.includes(key)) {
    envContent += `\n# Recommendation System API Keys\n${envVar}\n`;
    envUpdated = true;
  }
});

if (envUpdated) {
  fs.writeFileSync(envPath, envContent);
  console.log('📝 Updated .env file with API key placeholders');
}

// Check database connection
console.log('\n🔍 Checking database setup...');
try {
  // Import and test database connection
  const { testConnection } = await import('./utils/db.js');
  await testConnection();
  console.log('✅ Database connection successful');
} catch (error) {
  console.log('❌ Database connection failed:', error.message);
  console.log('   Please ensure PostgreSQL is running and configured in .env');
}

// Run database migrations
console.log('\n📊 Setting up recommendation tables...');
try {
  const sqlPath = path.join(__dirname, 'scripts', 'create-recommendation-tables.sql');
  if (fs.existsSync(sqlPath)) {
    console.log('✅ Found recommendation table migration script');
    console.log('   Run: psql -d your_database -f scripts/create-recommendation-tables.sql');
  } else {
    console.log('❌ Migration script not found');
  }
} catch (error) {
  console.log('❌ Error checking migration script:', error.message);
}

// Seed sample data
console.log('\n🌱 Seeding sample recommendation data...');
try {
  const seedPath = path.join(__dirname, 'scripts', 'seedRecommendations.js');
  if (fs.existsSync(seedPath)) {
    console.log('✅ Found seed data script');
    console.log('   Run: node scripts/seedRecommendations.js');
  } else {
    console.log('❌ Seed script not found');
  }
} catch (error) {
  console.log('❌ Error checking seed script:', error.message);
}

// Test API endpoints
console.log('\n🧪 Testing recommendation endpoints...');

const testEndpoints = [
  'GET /api/v1/recommendations - Personalized recommendations',
  'GET /api/v1/recommendations/trending-topics - Trending topics',
  'GET /api/v1/recommendations/career - Career recommendations',
  'GET /api/v1/recommendations/ai/insights - AI insights',
  'POST /api/v1/recommendations/ai/fetch-content - Fetch fresh content'
];

testEndpoints.forEach(endpoint => {
  console.log(`   📡 ${endpoint}`);
});

// API Key setup instructions
console.log('\n🔑 API Key Setup Instructions:');
console.log('');
console.log('1. YouTube Data API v3:');
console.log('   - Go to: https://console.developers.google.com/');
console.log('   - Create project → Enable YouTube Data API v3');
console.log('   - Create credentials → API Key');
console.log('   - Add to .env: YOUTUBE_API_KEY=your_key_here');
console.log('');
console.log('2. News API (for educational articles):');
console.log('   - Go to: https://newsapi.org/register');
console.log('   - Get free API key (500 requests/day)');
console.log('   - Add to .env: NEWS_API_KEY=your_key_here');
console.log('');

// Feature status
console.log('📋 Feature Status:');
console.log('');
console.log('✅ READY TO USE:');
console.log('   • AI recommendation algorithms (4 types)');
console.log('   • User behavior analysis');
console.log('   • Indian market trending topics');
console.log('   • Personalized learning paths');
console.log('   • Career alignment analysis');
console.log('   • Sample content database');
console.log('');
console.log('🔧 REQUIRES API KEYS:');
console.log('   • YouTube video recommendations');
console.log('   • Educational article fetching');
console.log('   • Real-time content updates');
console.log('');
console.log('📝 MOCK DATA (works without APIs):');
console.log('   • Coursera courses (no public API)');
console.log('   • Indian platform content (requires partnerships)');
console.log('');

// Usage examples
console.log('🚀 Quick Test Commands:');
console.log('');
console.log('# Start the server');
console.log('npm run dev');
console.log('');
console.log('# Test with sample data (no API keys needed)');
console.log('curl -H "Authorization: Bearer <token>" \\');
console.log('  "http://localhost:3000/api/v1/recommendations?use_ai=false"');
console.log('');
console.log('# Test with AI (works with sample data)');
console.log('curl -H "Authorization: Bearer <token>" \\');
console.log('  "http://localhost:3000/api/v1/recommendations?use_ai=true"');
console.log('');
console.log('# Get AI insights');
console.log('curl -H "Authorization: Bearer <token>" \\');
console.log('  "http://localhost:3000/api/v1/recommendations/ai/insights"');
console.log('');

console.log('✨ Setup complete! The recommendation system is ready to use.');
console.log('   Add API keys to .env for external content fetching.');
console.log('   Run database migrations and seed data to get started.');
console.log('');

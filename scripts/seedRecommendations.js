import { Recommendation, TrendingTopic } from '../models/index.js';
import logger from '../utils/logger.js';

// Sample trending topics data for Indian context
const trendingTopicsData = [
  {
    topic_name: 'Artificial Intelligence and Machine Learning',
    description: 'AI/ML is revolutionizing industries in India with massive job opportunities in tech companies, startups, and government initiatives like Digital India.',
    category: 'ai_ml',
    target_age_groups: ['16-18', '18+'],
    target_standards: [11, 12],
    relevance_in_india: 'India is becoming a global AI hub with companies like TCS, Infosys investing heavily. Government\'s National AI Strategy aims to make India AI-ready.',
    future_prospects: 'Expected 1 million AI jobs by 2025. Average salary ranges from 6-25 LPA for freshers to experienced professionals.',
    trending_score: 95.5,
    growth_rate: 45.2,
    job_market_demand: 'very_high',
    salary_range: '6-25 LPA',
    skills_required: ['Python', 'Machine Learning', 'Deep Learning', 'Statistics', 'Data Analysis'],
    related_careers: ['Data Scientist', 'ML Engineer', 'AI Researcher', 'Data Analyst', 'AI Product Manager'],
    learning_path: ['Mathematics & Statistics', 'Python Programming', 'Machine Learning Basics', 'Deep Learning', 'Specialized AI Domains']
  },
  {
    topic_name: 'Digital Marketing and E-commerce',
    description: 'With India\'s digital revolution, digital marketing has become crucial for businesses, creating massive opportunities.',
    category: 'digital_marketing',
    target_age_groups: ['16-18', '18+'],
    target_standards: [10, 11, 12],
    relevance_in_india: 'India has 700+ million internet users. E-commerce market expected to reach $200 billion by 2026.',
    future_prospects: 'High demand across industries. Freelancing opportunities abundant. Salary ranges from 3-15 LPA.',
    trending_score: 88.3,
    growth_rate: 35.7,
    job_market_demand: 'very_high',
    salary_range: '3-15 LPA',
    skills_required: ['SEO/SEM', 'Social Media Marketing', 'Content Marketing', 'Analytics', 'PPC Advertising'],
    related_careers: ['Digital Marketing Manager', 'SEO Specialist', 'Content Strategist', 'Social Media Manager', 'E-commerce Manager'],
    learning_path: ['Digital Marketing Fundamentals', 'SEO & SEM', 'Social Media Marketing', 'Analytics & Data', 'Advanced Strategies']
  },
  {
    topic_name: 'Renewable Energy and Sustainability',
    description: 'India\'s commitment to renewable energy creates vast opportunities in solar, wind, and green technology sectors.',
    category: 'environment',
    target_age_groups: ['16-18', '18+'],
    target_standards: [10, 11, 12],
    relevance_in_india: 'India aims for 500 GW renewable capacity by 2030. Government policies strongly support green energy transition.',
    future_prospects: 'Massive job creation expected. Engineering and technical roles in high demand. Salary ranges from 4-20 LPA.',
    trending_score: 82.1,
    growth_rate: 28.5,
    job_market_demand: 'high',
    salary_range: '4-20 LPA',
    skills_required: ['Renewable Energy Systems', 'Environmental Engineering', 'Project Management', 'Sustainability Analysis'],
    related_careers: ['Renewable Energy Engineer', 'Sustainability Consultant', 'Environmental Analyst', 'Green Building Specialist'],
    learning_path: ['Environmental Science Basics', 'Renewable Energy Technologies', 'Engineering Principles', 'Policy & Regulations']
  },
  {
    topic_name: 'Cybersecurity and Ethical Hacking',
    description: 'With increasing digitalization, cybersecurity has become critical for protecting India\'s digital infrastructure.',
    category: 'technology',
    target_age_groups: ['16-18', '18+'],
    target_standards: [10, 11, 12],
    relevance_in_india: 'India faces 18% of global cyber attacks. Government and private sector investing heavily in cybersecurity.',
    future_prospects: 'Shortage of 3 million cybersecurity professionals globally. High-paying career with job security.',
    trending_score: 90.2,
    growth_rate: 42.1,
    job_market_demand: 'very_high',
    salary_range: '5-30 LPA',
    skills_required: ['Network Security', 'Ethical Hacking', 'Incident Response', 'Risk Assessment', 'Compliance'],
    related_careers: ['Cybersecurity Analyst', 'Ethical Hacker', 'Security Consultant', 'CISO', 'Forensic Analyst'],
    learning_path: ['Computer Networks', 'Operating Systems', 'Security Fundamentals', 'Ethical Hacking', 'Advanced Security']
  },
  {
    topic_name: 'Data Science and Analytics',
    description: 'Data-driven decision making is transforming Indian businesses, creating huge demand for data professionals.',
    category: 'data_science',
    target_age_groups: ['16-18', '18+'],
    target_standards: [11, 12],
    relevance_in_india: 'India generates 2.5 quintillion bytes of data daily. Companies need data scientists to extract insights.',
    future_prospects: 'Expected 11 million jobs in data science by 2026. One of the highest-paying tech careers.',
    trending_score: 92.8,
    growth_rate: 39.4,
    job_market_demand: 'very_high',
    salary_range: '6-28 LPA',
    skills_required: ['Statistics', 'Python/R', 'SQL', 'Machine Learning', 'Data Visualization', 'Business Analytics'],
    related_careers: ['Data Scientist', 'Data Analyst', 'Business Analyst', 'Data Engineer', 'Research Scientist'],
    learning_path: ['Statistics & Mathematics', 'Programming (Python/R)', 'Data Analysis', 'Machine Learning', 'Specialized Domains']
  }
];

// Sample recommendations data
const recommendationsData = [
  // AI/ML Content
  {
    title: 'Complete Machine Learning Course by Andrew Ng (Hindi Subtitles)',
    description: 'Comprehensive ML course covering algorithms, implementation, and real-world applications. Perfect for Indian students.',
    content_type: 'course',
    url: 'https://www.coursera.org/learn/machine-learning',
    thumbnail_url: 'https://example.com/ml-course-thumb.jpg',
    category: 'ai_ml',
    target_standards: [11, 12],
    difficulty_level: 'intermediate',
    duration_minutes: 3600,
    language: 'english',
    source: 'Coursera',
    author: 'Andrew Ng',
    rating: 4.8,
    tags: ['machine learning', 'algorithms', 'python', 'career', 'certification'],
    trending_score: 95.0
  },
  {
    title: 'AI Career Opportunities in India 2024',
    description: 'Detailed analysis of AI job market in India, salary trends, and career paths for students.',
    content_type: 'article',
    url: 'https://example.com/ai-careers-india',
    category: 'ai_ml',
    target_standards: [10, 11, 12],
    difficulty_level: 'beginner',
    duration_minutes: 15,
    language: 'english',
    source: 'TechCrunch India',
    rating: 4.5,
    tags: ['career', 'jobs', 'salary', 'india', 'future'],
    trending_score: 88.5
  },
  
  // Digital Marketing Content
  {
    title: 'Digital Marketing Masterclass for Indian Market',
    description: 'Learn digital marketing strategies specifically for Indian consumers and businesses.',
    content_type: 'course',
    url: 'https://example.com/digital-marketing-india',
    category: 'digital_marketing',
    target_standards: [10, 11, 12],
    difficulty_level: 'beginner',
    duration_minutes: 1200,
    language: 'hindi',
    source: 'Unacademy',
    author: 'Digital Marketing Expert',
    rating: 4.6,
    tags: ['digital marketing', 'seo', 'social media', 'career', 'business'],
    trending_score: 85.2
  },
  {
    title: 'How to Start Your Digital Marketing Career in India',
    description: 'Step-by-step guide for students to enter the digital marketing field with practical tips.',
    content_type: 'video',
    url: 'https://youtube.com/watch?v=example',
    category: 'digital_marketing',
    target_standards: [10, 11, 12],
    difficulty_level: 'beginner',
    duration_minutes: 45,
    language: 'hindi',
    source: 'YouTube',
    rating: 4.3,
    tags: ['career', 'beginner', 'jobs', 'skills', 'freelancing'],
    trending_score: 82.1
  },
  
  // Programming Content
  {
    title: 'Python Programming for Beginners - Complete Course',
    description: 'Learn Python from scratch with practical projects and Indian context examples.',
    content_type: 'course',
    url: 'https://example.com/python-beginners',
    category: 'programming',
    target_standards: [9, 10, 11, 12],
    difficulty_level: 'beginner',
    duration_minutes: 2400,
    language: 'hindi',
    source: 'CodeWithHarry',
    author: 'Haris Khan',
    rating: 4.7,
    tags: ['python', 'programming', 'coding', 'beginner', 'projects'],
    trending_score: 89.3
  },
  
  // Cybersecurity Content
  {
    title: 'Ethical Hacking Course for Indian Students',
    description: 'Learn cybersecurity and ethical hacking with focus on Indian cyber laws and regulations.',
    content_type: 'course',
    url: 'https://example.com/ethical-hacking-india',
    category: 'technology',
    target_standards: [11, 12],
    difficulty_level: 'intermediate',
    duration_minutes: 1800,
    language: 'english',
    source: 'Cybrary',
    rating: 4.4,
    tags: ['cybersecurity', 'ethical hacking', 'security', 'career', 'certification'],
    trending_score: 87.6
  },
  
  // Career Guidance
  {
    title: 'Top 10 Emerging Careers for Indian Students in 2024',
    description: 'Explore new career opportunities in technology, sustainability, and digital sectors.',
    content_type: 'article',
    url: 'https://example.com/emerging-careers-2024',
    category: 'career',
    target_standards: [10, 11, 12],
    difficulty_level: 'beginner',
    duration_minutes: 20,
    language: 'english',
    source: 'Career360',
    rating: 4.2,
    tags: ['career', 'future', 'jobs', 'technology', 'guidance'],
    trending_score: 83.4
  },
  
  // Science & Technology
  {
    title: 'ISRO and Space Technology Careers in India',
    description: 'Learn about opportunities in India\'s space program and related technology sectors.',
    content_type: 'video',
    url: 'https://youtube.com/watch?v=isro-careers',
    category: 'science',
    target_standards: [10, 11, 12],
    difficulty_level: 'intermediate',
    duration_minutes: 35,
    language: 'hindi',
    source: 'YouTube',
    rating: 4.5,
    tags: ['space', 'isro', 'science', 'career', 'technology'],
    trending_score: 79.8
  },
  
  // Entrepreneurship
  {
    title: 'Young Entrepreneurs Success Stories from India',
    description: 'Inspiring stories of young Indian entrepreneurs and startup founders.',
    content_type: 'article',
    url: 'https://example.com/young-entrepreneurs-india',
    category: 'entrepreneurship',
    target_standards: [10, 11, 12],
    difficulty_level: 'beginner',
    duration_minutes: 25,
    language: 'english',
    source: 'YourStory',
    rating: 4.1,
    tags: ['entrepreneurship', 'startup', 'business', 'inspiration', 'success'],
    trending_score: 76.5
  }
];

async function seedRecommendations() {
  try {
    logger.info('Starting to seed recommendation data...');
    
    // Clear existing data (optional - remove in production)
    await TrendingTopic.destroy({ where: {} });
    await Recommendation.destroy({ where: {} });
    
    // Insert trending topics
    logger.info('Inserting trending topics...');
    await TrendingTopic.bulkCreate(trendingTopicsData);
    logger.info(`Inserted ${trendingTopicsData.length} trending topics`);
    
    // Insert recommendations
    logger.info('Inserting recommendations...');
    await Recommendation.bulkCreate(recommendationsData);
    logger.info(`Inserted ${recommendationsData.length} recommendations`);
    
    logger.info('Recommendation data seeded successfully!');
    
    // Display summary
    const topicsCount = await TrendingTopic.count();
    const recommendationsCount = await Recommendation.count();
    
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Trending Topics: ${topicsCount}`);
    console.log(`Recommendations: ${recommendationsCount}`);
    console.log('=======================\n');
    
  } catch (error) {
    logger.error('Error seeding recommendation data:', error);
    throw error;
  }
}

// Run the seeding function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRecommendations()
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedRecommendations;

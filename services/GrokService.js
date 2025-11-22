import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Service to interact with xAI Grok API for AI-powered analysis
 */
class GrokService {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
    this.apiUrl = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
  }

  /**
   * Analyze user activity logs and generate predictions about future behavior
   * @param {Array} activities - Array of user activity logs
   * @param {Object} userProfile - User profile information
   * @returns {Object} AI-generated predictions and insights
   */
  async analyzeActivityPatterns(activities, userProfile = {}) {
    try {
      if (!this.apiKey) {
        logger.warn('Grok API key not configured, using mock predictions');
        return this.generateMockPredictions(activities);
      }

      // Prepare activity summary for AI analysis
      const activitySummary = this.prepareActivitySummary(activities);
      
      // Create prompt for Grok
      const prompt = this.createAnalysisPrompt(activitySummary, userProfile);

      // Call Grok API
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are an expert behavioral analyst specializing in digital activity patterns and productivity insights. Analyze user activity data and provide predictions about future behavior patterns.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Parse Grok response
      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse, activities);

    } catch (error) {
      logger.error('Error calling Grok API:', error);
      // Fallback to mock predictions if API fails
      return this.generateMockPredictions(activities);
    }
  }

  /**
   * Prepare activity summary for AI analysis
   */
  prepareActivitySummary(activities) {
    if (!activities || activities.length === 0) {
      return {
        totalActivities: 0,
        timeRange: null,
        appUsage: {},
        timePatterns: {},
        categoryBreakdown: {}
      };
    }

    // Calculate time range
    const timestamps = activities.map(a => new Date(a.start_time)).sort((a, b) => a - b);
    const startDate = timestamps[0];
    const endDate = timestamps[timestamps.length - 1];
    const daysTracked = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // App usage statistics
    const appUsage = {};
    const categoryBreakdown = {
      productive: 0,
      neutral: 0,
      distracting: 0
    };

    activities.forEach(activity => {
      const app = activity.app_name || 'unknown';
      if (!appUsage[app]) {
        appUsage[app] = { count: 0, totalDuration: 0, lastUsed: null };
      }
      appUsage[app].count++;
      appUsage[app].totalDuration += parseFloat(activity.duration || 0);
      if (!appUsage[app].lastUsed || new Date(activity.start_time) > new Date(appUsage[app].lastUsed)) {
        appUsage[app].lastUsed = activity.start_time;
      }

      // Categorize
      const appLower = app.toLowerCase();
      if (['vscode', 'terminal', 'slack', 'chrome', 'firefox', 'safari'].some(p => appLower.includes(p))) {
        categoryBreakdown.productive += parseFloat(activity.duration || 0);
      } else if (['youtube', 'facebook', 'twitter', 'instagram', 'netflix', 'spotify'].some(d => appLower.includes(d))) {
        categoryBreakdown.distracting += parseFloat(activity.duration || 0);
      } else {
        categoryBreakdown.neutral += parseFloat(activity.duration || 0);
      }
    });

    // Time patterns (hour of day)
    const timePatterns = {};
    activities.forEach(activity => {
      const hour = new Date(activity.start_time).getHours();
      if (!timePatterns[hour]) {
        timePatterns[hour] = 0;
      }
      timePatterns[hour] += parseFloat(activity.duration || 0);
    });

    // Top apps
    const topApps = Object.entries(appUsage)
      .sort((a, b) => b[1].totalDuration - a[1].totalDuration)
      .slice(0, 10)
      .map(([app, data]) => ({
        app,
        usageHours: (data.totalDuration / 3600).toFixed(2),
        sessions: data.count
      }));

    return {
      totalActivities: activities.length,
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        daysTracked
      },
      appUsage: topApps,
      timePatterns,
      categoryBreakdown,
      totalTimeHours: (Object.values(categoryBreakdown).reduce((a, b) => a + b, 0) / 3600).toFixed(2)
    };
  }

  /**
   * Create prompt for Grok AI analysis
   */
  createAnalysisPrompt(activitySummary, userProfile) {
    return `Analyze the following user activity data and provide insights about their behavior patterns and predictions for future activity.

USER PROFILE:
- Student Standard: ${userProfile.student_standard || 'Not specified'}
- Username: ${userProfile.username || 'Unknown'}

ACTIVITY SUMMARY:
- Total Activities Logged: ${activitySummary.totalActivities}
- Days Tracked: ${activitySummary.timeRange?.daysTracked || 0}
- Total Time: ${activitySummary.totalTimeHours} hours

TOP APPLICATIONS:
${activitySummary.appUsage.map((app, i) => `${i + 1}. ${app.app}: ${app.usageHours} hours (${app.sessions} sessions)`).join('\n')}

CATEGORY BREAKDOWN:
- Productive Time: ${(activitySummary.categoryBreakdown.productive / 3600).toFixed(2)} hours
- Neutral Time: ${(activitySummary.categoryBreakdown.neutral / 3600).toFixed(2)} hours
- Distracting Time: ${(activitySummary.categoryBreakdown.distracting / 3600).toFixed(2)} hours

TIME PATTERNS (Peak Activity Hours):
${Object.entries(activitySummary.timePatterns)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([hour, duration]) => `- Hour ${hour}:00 - ${(duration / 3600).toFixed(2)} hours`)
  .join('\n')}

Please provide:
1. Behavioral patterns you observe
2. Predictions about what this user is likely to do in the future (next week/month)
3. Recommendations for improving productivity
4. Potential concerns or areas of improvement

Format your response as JSON with the following structure:
{
  "behavioral_patterns": ["pattern1", "pattern2"],
  "predictions": {
    "next_week": ["prediction1", "prediction2"],
    "next_month": ["prediction1", "prediction2"]
  },
  "recommendations": ["recommendation1", "recommendation2"],
  "concerns": ["concern1", "concern2"],
  "productivity_trend": "increasing" | "decreasing" | "stable"
}`;
  }

  /**
   * Parse AI response and structure it
   */
  parseAIResponse(aiResponse, activities) {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          predictions: parsed.predictions || {},
          behavioral_patterns: parsed.behavioral_patterns || [],
          recommendations: parsed.recommendations || [],
          concerns: parsed.concerns || [],
          productivity_trend: parsed.productivity_trend || 'stable',
          confidence_score: this.calculateConfidenceScore(activities),
          analysis_date: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error('Error parsing AI response:', error);
    }

    // Fallback: return structured response from text
    return {
      predictions: {
        next_week: ['Based on current patterns, user will likely continue similar activity levels'],
        next_month: ['Activity patterns suggest stable behavior with minor variations']
      },
      behavioral_patterns: ['Pattern analysis in progress'],
      recommendations: ['Continue monitoring for better insights'],
      concerns: [],
      productivity_trend: 'stable',
      confidence_score: 0.5,
      analysis_date: new Date().toISOString(),
      raw_response: aiResponse
    };
  }

  /**
   * Generate mock predictions when API is not available
   */
  generateMockPredictions(activities) {
    const summary = this.prepareActivitySummary(activities);
    
    // Simple pattern-based predictions
    const topApp = summary.appUsage[0]?.app || 'unknown';
    const productiveRatio = summary.categoryBreakdown.productive / 
      (summary.categoryBreakdown.productive + summary.categoryBreakdown.distracting + summary.categoryBreakdown.neutral);

    const predictions = {
      next_week: [
        `User will likely continue using ${topApp} as primary application`,
        productiveRatio > 0.6 
          ? 'High productivity trend expected to continue'
          : 'Productivity improvement opportunities identified'
      ],
      next_month: [
        'Activity patterns suggest stable behavior',
        productiveRatio > 0.7 
          ? 'Maintaining high productivity levels'
          : 'Potential for productivity optimization'
      ]
    };

    return {
      predictions,
      behavioral_patterns: [
        `Primary application: ${topApp}`,
        `Productive time ratio: ${(productiveRatio * 100).toFixed(1)}%`,
        `Average daily activity: ${(summary.totalActivities / (summary.timeRange?.daysTracked || 1)).toFixed(0)} activities`
      ],
      recommendations: [
        productiveRatio < 0.5 
          ? 'Consider reducing time on distracting applications'
          : 'Maintain current productive habits',
        'Track progress weekly for better insights'
      ],
      concerns: productiveRatio < 0.4 
        ? ['Low productivity ratio detected', 'High distracting app usage']
        : [],
      productivity_trend: productiveRatio > 0.6 ? 'increasing' : productiveRatio < 0.4 ? 'decreasing' : 'stable',
      confidence_score: summary.totalActivities > 100 ? 0.8 : 0.5,
      analysis_date: new Date().toISOString(),
      note: 'Mock predictions - Grok API not configured'
    };
  }

  /**
   * Calculate confidence score based on data quality
   */
  calculateConfidenceScore(activities) {
    if (!activities || activities.length === 0) return 0.1;
    
    const daysTracked = this.prepareActivitySummary(activities).timeRange?.daysTracked || 1;
    const avgDailyActivities = activities.length / daysTracked;
    
    // More data = higher confidence
    if (daysTracked >= 30 && avgDailyActivities >= 50) return 0.9;
    if (daysTracked >= 14 && avgDailyActivities >= 30) return 0.7;
    if (daysTracked >= 7 && avgDailyActivities >= 20) return 0.5;
    return 0.3;
  }
}

export default new GrokService();

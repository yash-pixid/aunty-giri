import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_TEMPERATURE = parseFloat(process.env.GROQ_TEMPERATURE || '0.3');
const GROQ_MAX_TOKENS = parseInt(process.env.GROQ_MAX_TOKENS || '2048');
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.GROQ_RATE_LIMIT_PER_MINUTE || '30');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Rate limiting state
const rateLimiter = {
  requests: [],
  cleanupInterval: null
};

class GroqVisionService {
  constructor() {
    if (!GROQ_API_KEY) {
      logger.error('GROQ_API_KEY is not set in environment variables');
      throw new Error('GROQ_API_KEY is required');
    }

    this.client = new Groq({
      apiKey: GROQ_API_KEY
    });

    // Start rate limit cleanup
    this.startRateLimitCleanup();
    
    logger.info('GroqVisionService initialized', {
      model: GROQ_MODEL,
      temperature: GROQ_TEMPERATURE,
      maxTokens: GROQ_MAX_TOKENS,
      rateLimit: RATE_LIMIT_PER_MINUTE
    });
  }

  /**
   * Start cleanup interval for rate limiter
   */
  startRateLimitCleanup() {
    // Clean up old requests every 10 seconds
    rateLimiter.cleanupInterval = setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000;
      rateLimiter.requests = rateLimiter.requests.filter(time => time > oneMinuteAgo);
    }, 10000);
  }

  /**
   * Check if we're within rate limits
   */
  async checkRateLimit() {
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = rateLimiter.requests.filter(time => time > oneMinuteAgo);
    
    if (recentRequests.length >= RATE_LIMIT_PER_MINUTE) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = 60000 - (Date.now() - oldestRequest) + 1000; // Add 1s buffer
      
      logger.warn('Rate limit reached, waiting...', {
        recentRequests: recentRequests.length,
        waitTimeMs: waitTime
      });
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    rateLimiter.requests.push(Date.now());
  }

  /**
   * Convert image file to base64
   */
  async imageToBase64(filePath) {
    try {
      const absolutePath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath}`);
      }

      const imageBuffer = fs.readFileSync(absolutePath);
      const base64Image = imageBuffer.toString('base64');
      
      return base64Image;
    } catch (error) {
      logger.error('Error converting image to base64:', error);
      throw error;
    }
  }

  /**
   * Create structured prompt for screenshot analysis
   */
  createAnalysisPrompt() {
    return `Analyze this screenshot in detail and extract comprehensive information in JSON format:

{
  "app_name": "Full name of the primary application (e.g., 'Google Chrome', 'Visual Studio Code', 'Microsoft Excel')",
  "window_title": "Complete window title or main content heading",
  "activity_category": "productive" | "neutral" | "distracting",
  "activity_type": "coding" | "browsing" | "video" | "gaming" | "document" | "social" | "communication" | "design" | "reading" | "meeting" | "other",
  "focus_score": 0-100,
  "content_summary": "Detailed description of what the user is doing (200-300 chars)",
  "detected_text": "Important visible text, headings, and content (up to 800 chars)",
  "detected_objects": ["UI elements like buttons, menus, tabs, toolbars, etc."],
  "ui_elements": {
    "tabs_count": 0,
    "windows_count": 1,
    "visible_notifications": false,
    "full_screen": false,
    "multiple_monitors": false
  },
  "website_url": "URL if browser (null otherwise)",
  "domain": "domain.com if applicable (null otherwise)",
  "programming_language": "Language if coding (null otherwise)",
  "file_type": "File extension/type being worked on (null if not applicable)",
  "distraction_indicators": ["social media", "entertainment", "games", "shopping", etc or empty array],
  "productivity_indicators": ["code", "documentation", "work apps", "research", etc or empty array],
  "visible_brands": ["Recognizable brand names or logos"],
  "color_scheme": "dark" | "light" | "mixed",
  "screen_density": "cluttered" | "organized" | "minimal",
  "user_action": "What action is the user likely performing (e.g., 'writing code', 'watching video', 'reading article')",
  "time_of_day_hint": "morning" | "afternoon" | "evening" | "night" | "unknown" (based on screen brightness/blue light),
  "multitasking_detected": true/false,
  "attention_level": "high" | "medium" | "low" (based on content complexity and focus indicators),
  "content_type": "text" | "video" | "image" | "mixed" | "code" | "data",
  "sensitive_info_detected": false (true only if financial data, personal info visible),
  "keywords": ["5-10 relevant keywords from visible content"],
  "confidence": 0.0-1.0
}

Analysis Guidelines:
- Be extremely detailed and specific
- Extract ALL visible text that seems important
- Identify specific apps, not generic terms ("Slack" not "chat app")
- For coding: identify language, framework, and what they're building
- For browsing: get website name, domain, and content type
- Look for productivity vs distraction signals
- Note UI complexity and organization
- Identify brands, logos, and recognizable interfaces
- Consider context clues (dark mode = late work, multiple tabs = research)
- Estimate focus level from screen organization and content density
- ONLY respond with valid JSON, no markdown, no extra text`;
  }

  /**
   * Parse and validate AI response
   */
  parseAIResponse(responseText) {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const requiredFields = ['app_name', 'activity_category', 'activity_type', 'content_summary'];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          logger.warn(`Missing required field: ${field}`);
        }
      }

      // Set defaults for missing fields and return enhanced data
      return {
        // Core fields
        app_name: parsed.app_name || 'Unknown Application',
        window_title: parsed.window_title || '',
        activity_category: parsed.activity_category || 'neutral',
        activity_type: parsed.activity_type || 'other',
        focus_score: parsed.focus_score || 50,
        content_summary: parsed.content_summary || 'Screenshot analysis',
        
        // Detection fields
        detected_text: parsed.detected_text || '',
        detected_objects: Array.isArray(parsed.detected_objects) ? parsed.detected_objects : [],
        
        // UI analysis
        ui_elements: parsed.ui_elements || {
          tabs_count: 0,
          windows_count: 1,
          visible_notifications: false,
          full_screen: false,
          multiple_monitors: false
        },
        
        // Context fields
        website_url: parsed.website_url || null,
        domain: parsed.domain || null,
        programming_language: parsed.programming_language || null,
        file_type: parsed.file_type || null,
        
        // Behavioral indicators
        distraction_indicators: Array.isArray(parsed.distraction_indicators) ? parsed.distraction_indicators : [],
        productivity_indicators: Array.isArray(parsed.productivity_indicators) ? parsed.productivity_indicators : [],
        
        // Visual analysis
        visible_brands: Array.isArray(parsed.visible_brands) ? parsed.visible_brands : [],
        color_scheme: parsed.color_scheme || 'unknown',
        screen_density: parsed.screen_density || 'organized',
        
        // Activity analysis
        user_action: parsed.user_action || 'unknown',
        time_of_day_hint: parsed.time_of_day_hint || 'unknown',
        multitasking_detected: parsed.multitasking_detected || false,
        attention_level: parsed.attention_level || 'medium',
        content_type: parsed.content_type || 'mixed',
        
        // Security
        sensitive_info_detected: parsed.sensitive_info_detected || false,
        
        // Keywords
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        
        // Metadata
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  /**
   * Analyze screenshot with retry logic
   */
  async analyzeScreenshot(filePath, retryCount = 0) {
    try {
      // Check rate limit
      await this.checkRateLimit();

      // Convert image to base64
      const base64Image = await this.imageToBase64(filePath);

      // Create prompt
      const prompt = this.createAnalysisPrompt();

      logger.info('Sending screenshot to Groq Vision API', {
        filePath,
        model: GROQ_MODEL,
        attempt: retryCount + 1
      });

      // Call Groq API
      const response = await this.client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/webp;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: GROQ_TEMPERATURE,
        max_tokens: GROQ_MAX_TOKENS,
        top_p: 1,
        stream: false
      });

      // Extract response
      const responseText = response.choices[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('Empty response from Groq API');
      }

      // Parse and validate response
      const analysis = this.parseAIResponse(responseText);

      logger.info('Screenshot analysis completed', {
        filePath,
        appName: analysis.app_name,
        activityType: analysis.activity_type,
        confidence: analysis.confidence
      });

      return {
        success: true,
        analysis,
        model: GROQ_MODEL,
        tokensUsed: response.usage?.total_tokens || 0,
        raw_response: responseText
      };
    } catch (error) {
      logger.error('Error analyzing screenshot:', {
        error: error.message,
        filePath,
        attempt: retryCount + 1
      });

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
        logger.info(`Retrying in ${delay}ms...`, { attempt: retryCount + 2 });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.analyzeScreenshot(filePath, retryCount + 1);
      }

      // Max retries exceeded
      return {
        success: false,
        error: error.message,
        retries: retryCount
      };
    }
  }

  /**
   * Analyze multiple screenshots in batch
   */
  async analyzeScreenshotsBatch(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      const result = await this.analyzeScreenshot(filePath);
      results.push({
        filePath,
        ...result
      });
      
      // Small delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      // Simple test with a small request
      const testResponse = await this.client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: 'Test'
          }
        ],
        max_tokens: 10
      });

      return {
        healthy: true,
        model: GROQ_MODEL,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Groq API health check failed:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (rateLimiter.cleanupInterval) {
      clearInterval(rateLimiter.cleanupInterval);
    }
  }
}

// Export singleton instance
export default new GroqVisionService();

import Bull from 'bull';
import groqVisionService from './groqVisionService.js';
import { Screenshot } from '../models/index.js';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const QUEUE_NAME = 'screenshot-processing';
const CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '2');
const JOB_ATTEMPTS = 3;
const BACKOFF_DELAY = 5000;

// Create Bull queue
const screenshotQueue = new Bull(QUEUE_NAME, REDIS_URL, {
  defaultJobOptions: {
    attempts: JOB_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: BACKOFF_DELAY
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Process screenshot analysis job
 */
screenshotQueue.process(CONCURRENCY, async (job) => {
  const { screenshotId, filePath } = job.data;
  
  logger.info('Processing screenshot job', {
    jobId: job.id,
    screenshotId,
    filePath,
    attempt: job.attemptsMade + 1
  });

  try {
    // Update status to processing
    await Screenshot.update(
      { processing_status: 'processing' },
      { where: { id: screenshotId } }
    );

    // Analyze screenshot using Groq Vision API
    const result = await groqVisionService.analyzeScreenshot(filePath);

    if (result.success) {
      // Update screenshot with analysis results
      await Screenshot.update(
        {
          processing_status: 'completed',
          processed_at: new Date(),
          ai_analysis: result.analysis,
          processing_error: null
        },
        { where: { id: screenshotId } }
      );

      logger.info('Screenshot analysis completed successfully', {
        screenshotId,
        appName: result.analysis.app_name,
        activityType: result.analysis.activity_type
      });

      return {
        success: true,
        screenshotId,
        analysis: result.analysis
      };
    } else {
      throw new Error(result.error || 'Analysis failed');
    }
  } catch (error) {
    logger.error('Screenshot processing job failed', {
      jobId: job.id,
      screenshotId,
      error: error.message,
      attempt: job.attemptsMade + 1
    });

    // Update screenshot with error on final failure
    if (job.attemptsMade + 1 >= JOB_ATTEMPTS) {
      await Screenshot.update(
        {
          processing_status: 'failed',
          processing_error: error.message,
          processed_at: new Date()
        },
        { where: { id: screenshotId } }
      );
    }

    throw error;
  }
});

/**
 * Queue event handlers
 */
screenshotQueue.on('completed', (job, result) => {
  logger.info('Job completed', {
    jobId: job.id,
    screenshotId: result.screenshotId
  });
});

screenshotQueue.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job.id,
    screenshotId: job.data.screenshotId,
    error: error.message,
    attempts: job.attemptsMade
  });
});

screenshotQueue.on('stalled', (job) => {
  logger.warn('Job stalled', {
    jobId: job.id,
    screenshotId: job.data.screenshotId
  });
});

/**
 * Add screenshot to processing queue
 */
export async function queueScreenshotForProcessing(screenshotId, filePath) {
  try {
    const job = await screenshotQueue.add(
      {
        screenshotId,
        filePath
      },
      {
        priority: 1, // Lower number = higher priority
        timeout: 60000 // 60 seconds timeout
      }
    );

    logger.info('Screenshot queued for processing', {
      jobId: job.id,
      screenshotId,
      filePath
    });

    return {
      success: true,
      jobId: job.id
    };
  } catch (error) {
    logger.error('Failed to queue screenshot', {
      screenshotId,
      error: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      screenshotQueue.getWaitingCount(),
      screenshotQueue.getActiveCount(),
      screenshotQueue.getCompletedCount(),
      screenshotQueue.getFailedCount(),
      screenshotQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  } catch (error) {
    logger.error('Failed to get queue stats', error);
    return null;
  }
}

/**
 * Retry failed job
 */
export async function retryFailedJob(jobId) {
  try {
    const job = await screenshotQueue.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.retry();
    
    logger.info('Job retry initiated', { jobId });
    
    return {
      success: true,
      jobId
    };
  } catch (error) {
    logger.error('Failed to retry job', {
      jobId,
      error: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process pending screenshots (for batch processing)
 */
export async function processPendingScreenshots(limit = 10) {
  try {
    const pendingScreenshots = await Screenshot.findAll({
      where: {
        processing_status: 'pending'
      },
      limit,
      order: [['created_at', 'ASC']]
    });

    logger.info(`Found ${pendingScreenshots.length} pending screenshots to process`);

    const queueResults = [];
    for (const screenshot of pendingScreenshots) {
      const result = await queueScreenshotForProcessing(
        screenshot.id,
        screenshot.file_path
      );
      queueResults.push(result);
    }

    return {
      success: true,
      queued: queueResults.filter(r => r.success).length,
      failed: queueResults.filter(r => !r.success).length
    };
  } catch (error) {
    logger.error('Failed to process pending screenshots', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cleanup queue
 */
export async function cleanupQueue() {
  try {
    // Clean completed jobs older than 24 hours
    await screenshotQueue.clean(24 * 3600 * 1000, 'completed');
    
    // Clean failed jobs older than 7 days
    await screenshotQueue.clean(7 * 24 * 3600 * 1000, 'failed');
    
    logger.info('Queue cleanup completed');
    
    return { success: true };
  } catch (error) {
    logger.error('Queue cleanup failed', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Graceful shutdown
 */
export async function closeQueue() {
  try {
    await screenshotQueue.close();
    logger.info('Screenshot queue closed');
  } catch (error) {
    logger.error('Error closing queue', error);
  }
}

export default screenshotQueue;

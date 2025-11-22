import express from 'express';
const router = express.Router();
import * as monitorController from '../controllers/monitorController.js';
import * as analysisController from '../controllers/analysisController.js';
import { authenticate } from '../middleware/auth.js';
import { upload, processImage } from '../utils/upload.js';

// Apply authentication middleware to all monitor routes
router.use(authenticate);

// Screenshot endpoints
router.post('/screenshot', upload.single('screenshot'), monitorController.uploadScreenshot);
router.get('/screenshots', monitorController.getScreenshots);
router.delete('/screenshots/:id', monitorController.deleteScreenshot);

// AI Analysis endpoints
router.get('/screenshots/:id/analysis', analysisController.getScreenshotAnalysis);
router.post('/screenshots/:id/reprocess', analysisController.reprocessScreenshot);
router.get('/analysis/summary', analysisController.getAnalysisSummary);
router.get('/analysis/queue-stats', analysisController.getQueueStatistics);
router.post('/analysis/batch-process', analysisController.triggerBatchProcessing);
router.get('/analysis/health', analysisController.checkAPIHealth);

// Activity tracking endpoints
router.post('/activity', monitorController.logActivity);
router.get('/activities', monitorController.getActivities);
router.get('/activities/summary', monitorController.getActivitySummary);

// Keystroke logging endpoints
router.post('/keystrokes', monitorController.logKeystrokes);
router.get('/keystrokes', monitorController.getKeystrokes);

// System metrics endpoints
router.post('/metrics', monitorController.logMetrics);
router.get('/metrics', monitorController.getMetrics);
router.get('/metrics/summary', monitorController.getMetricsSummary);

export default router;

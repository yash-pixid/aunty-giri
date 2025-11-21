import express from 'express';
const router = express.Router();
import * as monitorController from '../controllers/monitorController.js';
import { authenticate } from '../middleware/auth.js';
import { upload, processImage } from '../utils/upload.js';

// Apply authentication middleware to all monitor routes
router.use(authenticate);

// Screenshot endpoints
router.post('/screenshot', upload.single('screenshot'), monitorController.uploadScreenshot);
router.get('/screenshots', monitorController.getScreenshots);
router.delete('/screenshots/:id', monitorController.deleteScreenshot);

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

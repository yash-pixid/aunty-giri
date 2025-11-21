import express from 'express';
const router = express.Router();
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

// Apply authentication middleware to all dashboard routes
router.use(authenticate);

// Dashboard summary and analytics
router.get('/summary', dashboardController.getDashboardSummary);
router.get('/timeline', dashboardController.getActivityTimeline);
router.get('/top-apps', dashboardController.getTopApps);
router.get('/website-usage', dashboardController.getWebsiteUsage);
router.get('/productivity-score', dashboardController.getProductivityScore);
router.get('/screenshots', dashboardController.getScreenshots);
router.get('/activity-report', dashboardController.generateActivityReport);

export default router;

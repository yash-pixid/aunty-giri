import express from 'express';
const router = express.Router();
import * as mockDashboardController from '../controllers/mockDashboardController.js';

// Mock dashboard endpoints
router.get('/summary', mockDashboardController.getDashboardSummary);
router.get('/timeline', mockDashboardController.getActivityTimeline);
router.get('/top-apps', mockDashboardController.getTopApps);
router.get('/website-usage', mockDashboardController.getWebsiteUsage);
router.get('/productivity-score', mockDashboardController.getProductivityScore);
router.get('/screenshots', mockDashboardController.getScreenshots);
router.get('/activity-report', mockDashboardController.generateActivityReport);

export default router;

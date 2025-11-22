import express from 'express';
import * as focusController from '../controllers/focusController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All focus routes require authentication
router.use(authenticate);

// Session management routes
router.post('/sessions/start', focusController.startSession);
router.get('/sessions/active', focusController.getActiveSession);
router.post('/sessions/:id/pause', focusController.pauseSession);
router.post('/sessions/:id/resume', focusController.resumeSession);
router.post('/sessions/:id/end', focusController.endSession);
router.get('/sessions', focusController.getSessionHistory);
router.get('/sessions/:id', focusController.getSessionDetails);

// Analytics routes
router.get('/analytics', focusController.getFocusAnalytics);
router.get('/recommendations', focusController.getFocusRecommendations);

// Blocklist routes
router.get('/blocklist', focusController.getBlocklist);
router.post('/blocklist', focusController.addToBlocklist);
router.delete('/blocklist/:id', focusController.removeFromBlocklist);

export default router;

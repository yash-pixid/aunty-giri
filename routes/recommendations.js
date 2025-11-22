import express from 'express';
const router = express.Router();
import * as recommendationController from '../controllers/recommendationController.js';
import { authenticate } from '../middleware/auth.js';

// Populate endpoint - NO AUTHENTICATION (frontend calls this directly)
router.post('/populate', recommendationController.populateRecommendations);

// User recommendations endpoint - REQUIRES AUTHENTICATION
router.get('/user', authenticate, recommendationController.getUserRecommendations);

export default router;
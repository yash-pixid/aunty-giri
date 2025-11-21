import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getCurrentUser);
router.put('/profile', authController.updateProfile);
router.post('/logout', authController.logout);

export default router;

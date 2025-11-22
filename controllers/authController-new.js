import AuthService from '../services/AuthService.js';
import logger from '../utils/logger.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await AuthService.loginUser({ email, password });

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
    logger.error('Login controller error:', error);
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role, student_standard } = req.body;

    const result = await AuthService.registerUser({ username, email, password, role, student_standard});

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    if (error.message === 'User with this email or username already exists') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    logger.error('Registration controller error:', error);
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const user = await AuthService.getCurrentUser(req.user.id);

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    logger.error('Get current user controller error:', error);
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const { username, email, currentPassword, newPassword } = req.body;
    
    const user = await AuthService.updateUserProfile(req.user.id, {
      username,
      email,
      currentPassword,
      newPassword
    });

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    if (error.message === 'Current password is incorrect') {
      return res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
    logger.error('Update profile controller error:', error);
    next(error);
  }
};

// Refresh access token using refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const tokens = await AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: 'success',
      data: tokens
    });
  } catch (error) {
    if (error.message === 'Refresh token is required' || 
        error.message === 'Invalid token type' ||
        error.message === 'User not found or inactive' ||
        error.message === 'Invalid or expired refresh token') {
      return res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
    logger.error('Refresh token controller error:', error);
    next(error);
  }
};

export const logout = (req, res) => {
  // Since we're using JWT, client-side token invalidation is handled by removing the token from client storage
  // In production, you might want to maintain a blacklist of invalidated tokens
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

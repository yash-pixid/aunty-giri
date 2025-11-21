import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // 2. Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000) // Add issued at time
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 4. Remove password from output
    const userData = user.get({ plain: true });
    delete userData.password;

    // 5. Update last login time
    await user.update({ last_active: new Date() });

    // 6. Send response
    res.status(200).json({
      status: 'success',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role = 'student' } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or username already exists'
      });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      last_active: new Date()
    });

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 5. Remove password from output
    newUser.password = undefined;

    // 6. Send response
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
        token
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    // Default user when not authenticated
    const defaultUser = {
      id: 'anonymous',
      username: 'anonymous',
      email: 'anonymous@example.com',
      role: 'guest',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // If user is authenticated, get their details
    if (req.user && req.user.id) {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        raw: true
      });

      if (user) {
        return res.status(200).json({
          status: 'success',
          data: { user }
        });
      }
    }

    // Return default user if not authenticated or user not found
    res.status(200).json({
      status: 'success',
      data: {
        user: defaultUser
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 1. Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // 2. Update basic info if provided
    if (username) user.setDataValue('username', username);
    if (email) user.setDataValue('email', email);

    // 3. Update password if current password is provided
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.getDataValue('password'));
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }
      user.setDataValue('password', await bcrypt.hash(newPassword, 12));
    }

    // 4. Save changes
    await user.save();

    // 5. Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

export const logout = (req, res) => {
  // Since we're using JWT, client-side token invalidation is handled by removing the token from client storage
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

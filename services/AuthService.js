import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

class AuthService {
  /**
   * Generate JWT tokens (access and refresh)
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        jti: Math.random().toString(36).substring(2)
      },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  /**
   * Register a new user (single user registration - for backward compatibility)
   */
  async registerUser({ username, email, password, role , student_standard }) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }]
        }
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Create new user (password will be hashed by model hook)
      const newUser = await User.create({
        username,
        email,
        password,
        role,
        student_standard,
        last_active: new Date()
      });

      // Generate tokens
      const tokens = this.generateTokens(newUser);

      // Remove password from output
      const userData = newUser.get({ plain: true });
      delete userData.password;

      return {
        user: userData,
        ...tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Register parent and student together
   */
  async registerParentAndStudent({
    parent_name,
    parent_email, 
    parent_password,
    student_name,
    student_email,
    student_password,
    student_standard
  }) {
    const transaction = await User.sequelize.transaction();
    
    try {
      // Validate required fields
      if (!parent_name || !parent_email || !parent_password || 
          !student_name || !student_email || !student_password || student_standard === undefined || student_standard === null) {
        throw new Error('All fields are required: parent_name, parent_email, parent_password, student_name, student_email, student_password, student_standard');
      }

      // Validate student_standard is a valid integer between 1 and 12
      const standardInt = parseInt(student_standard, 10);
      if (isNaN(standardInt) || standardInt < 1 || standardInt > 12) {
        throw new Error('student_standard must be an integer between 1 and 12');
      }

      // Check if parent email already exists
      const existingParent = await User.findOne({
        where: {
          [Op.or]: [{ email: parent_email }, { username: parent_name }]
        }
      }, { transaction });

      if (existingParent) {
        throw new Error('Parent with this email or username already exists');
      }

      // Check if student email already exists
      const existingStudent = await User.findOne({
        where: {
          [Op.or]: [{ email: student_email }, { username: student_name }]
        }
      }, { transaction });

      if (existingStudent) {
        throw new Error('Student with this email or username already exists');
      }

      // Create parent user first (password will be hashed by model hook)
      const parentUser = await User.create({
        username: parent_name,
        email: parent_email,
        password: parent_password,
        role: 'parent',
        last_active: new Date()
      }, { transaction });

      // Create student user with parent_id reference (password will be hashed by model hook)
      const studentUser = await User.create({
        username: student_name,
        email: student_email,
        password: student_password,
        role: 'student',
        parent_id: parentUser.id,
        student_standard: standardInt,
        last_active: new Date()
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Generate tokens for the parent (primary account)
      const tokens = this.generateTokens(parentUser);

      // Remove passwords from output
      const parentData = parentUser.get({ plain: true });
      delete parentData.password;
      
      const studentData = studentUser.get({ plain: true });
      delete studentData.password;

      return {
        parent: parentData,
        student: studentData,
        primaryUser: parentData, // Parent is the primary user for login
        ...tokens
      };
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      logger.error('Parent-Student registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async loginUser({ email, password }) {
    try {
      // Find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login time
      await user.update({ last_active: new Date() });

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Remove password from output
      const userData = user.get({ plain: true });
      delete userData.password;

      return {
        user: userData,
        ...tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user from database
      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new Error('Invalid or expired refresh token');
      }
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, { username, email, currentPassword, newPassword }) {
    try {
      // Find the user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update basic info if provided
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;

      // Update password if current password is provided
      if (currentPassword && newPassword) {
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          throw new Error('Current password is incorrect');
        }
        updateData.password = await bcrypt.hash(newPassword, 12);
      }

      // Save changes
      await user.update(updateData);

      // Return user without password
      const userData = user.get({ plain: true });
      delete userData.password;

      return userData;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token and get user
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if it's an access token
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type. Access token required.');
      }
      
      const user = await User.findByPk(decoded.id);
      
      if (!user || !user.is_active) {
        throw new Error('Invalid token or user not active.');
      }

      // Update last_active timestamp
      await user.update({ last_active: new Date() });

      return user;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new Error('Invalid token.');
      }
      throw error;
    }
  }
}

export default new AuthService();

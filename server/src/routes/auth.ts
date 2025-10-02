import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../utils/database';
import { generateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Register with invitation code OR bypass for first user
router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password, fullName, invitationCode } = req.body;

    if (!email || !username || !password) {
      return next(createError('Email, username, and password are required', 400));
    }

    // Check if this is the first user (bypass invitation system)
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = userCount.rows[0].count === '0';

    if (!isFirstUser && !invitationCode) {
      return next(createError('Invitation code is required', 400));
    }

    // Verify invitation code (only if not first user)
    if (!isFirstUser) {
      const invitationResult = await query(
        'SELECT * FROM invitations WHERE invitation_code = $1 AND used = false AND expires_at > NOW()',
        [invitationCode]
      );

      if (invitationResult.rows.length === 0) {
        return next(createError('Invalid or expired invitation code', 400));
      }
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return next(createError('User with this email or username already exists', 409));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, username, password_hash, full_name, is_verified) 
       VALUES ($1, $2, $3, $4, true) RETURNING id, email, username, full_name`,
      [email, username, passwordHash, fullName]
    );

    const user = userResult.rows[0];

    // Mark invitation as used (only if not first user)
    if (!isFirstUser && invitationCode) {
      await query(
        'UPDATE invitations SET used = true WHERE invitation_code = $1',
        [invitationCode]
      );
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('Email and password are required', 400));
    }

    // Get user
    const userResult = await query(
      'SELECT id, email, username, password_hash, full_name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return next(createError('Invalid credentials', 401));
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return next(createError('Invalid credentials', 401));
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Create invitation (authenticated users only)
router.post('/invite', async (req, res, next) => {
  try {
    // This would need authentication middleware
    const { email } = req.body;
    
    if (!email) {
      return next(createError('Email is required', 400));
    }

    // Generate invitation code
    const invitationCode = uuidv4().substring(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // For now, we'll use a dummy inviter ID - in real app this would come from auth middleware
    const inviterId = req.body.inviterId; // This should come from authenticated user

    await query(
      'INSERT INTO invitations (email, invited_by, invitation_code, expires_at) VALUES ($1, $2, $3, $4)',
      [email, inviterId, invitationCode, expiresAt]
    );

    res.json({
      message: 'Invitation created successfully',
      invitationCode,
      expiresAt
    });
  } catch (error) {
    next(error);
  }
});

// TEMPORARY: Admin route to create invitation codes
// TODO: Remove this in production and add proper admin auth
router.post('/admin/create-invitation', async (req, res, next) => {
  try {
    const { email = 'admin@example.com' } = req.body;

    // Generate invitation code
    const invitationCode = uuidv4().substring(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await query(
      'INSERT INTO invitations (email, invitation_code, expires_at) VALUES ($1, $2, $3)',
      [email, invitationCode, expiresAt]
    );

    res.json({
      success: true,
      message: 'Invitation code created successfully!',
      invitationCode,
      email,
      expiresAt,
      instructions: 'Use this code on the registration page'
    });
  } catch (error) {
    next(error);
  }
});

// TEMPORARY: Direct admin account creation
// TODO: Remove this in production
router.post('/admin/create-account', async (req, res, next) => {
  try {
    const email = 'nicolas.catez92@gmail.com';
    const username = 'nicolas';
    const password = 'admin123';
    const fullName = 'Nicolas Catez';

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.json({
        success: false,
        message: 'User already exists! Try logging in instead.',
        loginUrl: 'https://food-for-brain.onrender.com'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, username, password_hash, full_name, is_verified) 
       VALUES ($1, $2, $3, $4, true) RETURNING id, email, username, full_name`,
      [email, username, passwordHash, fullName]
    );

    const user = userResult.rows[0];

    res.json({
      success: true,
      message: 'Admin account created successfully!',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name
      },
      credentials: {
        email: email,
        password: 'admin123'
      },
      instructions: 'Use these credentials to login'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
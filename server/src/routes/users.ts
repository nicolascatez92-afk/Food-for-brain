import express from 'express';
import { query } from '../utils/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userResult = await query(
      'SELECT id, email, username, full_name, bio, avatar_url, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userResult.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { fullName, bio, avatarUrl } = req.body;

    const result = await query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           bio = COALESCE($2, bio), 
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE id = $4 
       RETURNING id, email, username, full_name, bio, avatar_url`,
      [fullName, bio, avatarUrl, req.user!.id]
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: result.rows[0] 
    });
  } catch (error) {
    next(error);
  }
});

// Get friends list
router.get('/friends', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const friendsResult = await query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, f.created_at as friends_since
       FROM friendships f
       JOIN users u ON (f.friend_id = u.id)
       WHERE f.user_id = $1 AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [req.user!.id]
    );

    res.json({ friends: friendsResult.rows });
  } catch (error) {
    next(error);
  }
});

// Send friend request
router.post('/friends/request', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { username } = req.body;

    if (!username) {
      return next(createError('Username is required', 400));
    }

    // Find user by username
    const userResult = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    const friendId = userResult.rows[0].id;

    if (friendId === req.user!.id) {
      return next(createError('Cannot send friend request to yourself', 400));
    }

    // Check if friendship already exists
    const existingFriendship = await query(
      'SELECT id FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [req.user!.id, friendId]
    );

    if (existingFriendship.rows.length > 0) {
      return next(createError('Friendship already exists or pending', 409));
    }

    // Create friend request
    await query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)',
      [req.user!.id, friendId, 'pending']
    );

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
import express from 'express';
import User from '../models/User.js';
import { authMiddleware as auth, adminMiddleware as admin } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('team', 'name description')
      .populate('solvedChallenges', 'title category points')
      .populate('badges', 'name description icon');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      score: user.score,
      statistics: user.statistics,
      team: user.team,
      solvedChallenges: user.solvedChallenges,
      badges: user.badges,
      preferences: user.preferences,
      streak: user.streak,
      lastSolve: user.lastSolve
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { fullName, username, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username or email is already taken
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    user.fullName = fullName || user.fullName;
    user.username = username || user.username;
    user.email = email || user.email;

    await user.save();

    // Return transformed response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      score: user.score
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user statistics for current user (Authenticated user)
router.get('/me/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('solvedChallenges', 'points category')
      .populate('badges', 'name description points');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate stats
    const totalPoints = user.score || 0;
    const solvedChallenges = user.solvedChallenges?.length || 0;
    const achievements = user.badges?.length || 0;

    // Get global rank (simplified - could be optimized with aggregation)
    const usersWithHigherScore = await User.countDocuments({
      score: { $gt: totalPoints }
    });
    const rank = usersWithHigherScore + 1;

    // Calculate category-wise statistics
    const categoryStats = {};
    user.solvedChallenges?.forEach(challenge => {
      const category = challenge.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, points: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].points += challenge.points || 0;
    });

    res.json({
      totalPoints,
      solvedChallenges,
      rank,
      achievements,
      streak: user.streak || 0,
      categoryStats,
      lastSolve: user.lastSolve
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get all users with filtering and pagination (Admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = 'all',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role filter
    if (role && role !== 'all') {
      filter.role = role === 'admin' ? 'admin' : 'participant';
    }
    
    // Status filter
    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get users with pagination
    const users = await User.find(filter)
      .sort(sortConfig)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-password')
      .populate('team', 'name')
      .lean();

    // Transform users to match frontend expectations
    const transformedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      score: user.score,
      statistics: user.statistics,
      team: user.team,
      lastSolve: user.lastSolve,
      streak: user.streak
    }));

    // Get total count for pagination
    const totalCount = await User.countDocuments(filter);

    res.json({
      users: transformedUsers,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      hasNextPage: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details (Admin only)
router.get('/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('team', 'name description')
      .populate('solvedChallenges', 'title category points solvedAt')
      .populate('badges', 'name description icon awardedAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      score: user.score,
      statistics: user.statistics,
      team: user.team,
      solvedChallenges: user.solvedChallenges,
      badges: user.badges,
      preferences: user.preferences,
      streak: user.streak,
      lastSolve: user.lastSolve
    };

    res.json({ user: userResponse });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Create new user (Admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { username, email, fullName, role, status } = req.body;

    // Validate required fields
    if (!username || !email || !fullName) {
      return res.status(400).json({ error: 'Username, email, and full name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create user with temporary password
    const user = new User({
      username,
      email,
      fullName,
      role: role === 'admin' ? 'admin' : 'participant',
      isActive: status === 'active',
      password: 'TempPassword123!' // User should reset this
    });

    await user.save();
    
    // Return user without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      score: user.score
    };

    res.status(201).json({ 
      user: userResponse,
      message: 'User created successfully. Temporary password set.'
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { username, email, fullName, role, status, score } = req.body;
    
    // Build update data
    const updateData = {
      username,
      email,
      fullName,
      role: role === 'admin' ? 'admin' : 'participant',
      isActive: status === 'active'
    };

    // Add score if provided
    if (score !== undefined) {
      updateData.score = score;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('team', 'name');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      score: user.score,
      statistics: user.statistics,
      team: user.team
    };

    res.json({ 
      user: userResponse,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change user status (Admin only)
router.patch('/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: status === 'active' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.isActive ? 'active' : 'inactive'
      },
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Change user role (Admin only)
router.patch('/:id/role', auth, admin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Map frontend roles to your schema roles
    const roleMap = {
      'user': 'participant',
      'moderator': 'participant', // Map moderator to participant
      'admin': 'admin'
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: roleMap[role] },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: `User role updated to ${role} successfully`
    });

  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});


// Add these routes to your user routes file (after the existing routes)

// Get user submissions
router.get('/me/submissions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // This assumes you have a Submission model
    const submissions = await Submission.find({ user: req.user.id })
      .populate('challenge', 'title category points')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Submission.countDocuments({ user: req.user.id });

    res.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get user activity (simplified version)
router.get('/me/activity', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent submissions as activity
    const submissions = await Submission.find({ user: req.user.id })
      .populate('challenge', 'title points')
      .sort({ submittedAt: -1 })
      .limit(limit)
      .lean();

    const activities = submissions.map(sub => ({
      _id: sub._id,
      type: 'challenge_solved',
      description: `Solved "${sub.challenge?.title}" challenge`,
      points: sub.challenge?.points,
      timestamp: sub.submittedAt
    }));

    // You can add other activity types here (achievements, team joins, etc.)

    res.json(activities);
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get user statistics for admin dashboard
router.get('/stats/overview', auth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const participantUsers = await User.countDocuments({ role: 'participant' });
    
    // Recent users (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    // Users with highest scores
    const topUsers = await User.find()
      .sort({ score: -1 })
      .limit(5)
      .select('username score statistics streak')
      .lean();

    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admins: adminUsers,
      moderators: 0, // You don't have moderators
      regularUsers: participantUsers,
      recentUsers,
      topUsers
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Deactivate user account (Current user)
router.post('/me/deactivate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

// Reactivate user account (Admin only)
router.post('/:id/reactivate', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ 
      message: 'Account reactivated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.isActive ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Reactivate account error:', error);
    res.status(500).json({ error: 'Failed to reactivate account' });
  }
});

// Change password (Current user)
router.post('/me/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Reset password (Admin only)
router.post('/:id/reset-password', auth, admin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
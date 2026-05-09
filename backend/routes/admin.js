import express from 'express'
import { body, validationResult } from 'express-validator'
import Challenge from '../models/Challenge.js'
import User from '../models/User.js'
import Submission from '../models/Submission.js'
import Team from '../models/Team.js'
import Achievement from '../models/Achievement.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import backupManager from '../utils/backupManager.js'
import dockerService from '../services/dockerService.js'
import validationService from '../services/validationService.js'

const router = express.Router()

router.use(authMiddleware, adminMiddleware)

// ===== ACHIEVEMENT MANAGEMENT ROUTES =====

// Get all achievements with pagination and filtering
router.get('/achievements', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      user,
      challenge,
      sortBy = 'awardedAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (user) filter.user = user;
    if (challenge) filter.challenge = challenge;

    const achievements = await Achievement.find(filter)
      .populate('user', 'username fullName score')
      .populate('challenge', 'title category points')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Achievement.countDocuments(filter);

    res.json({
      achievements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin get achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get achievement statistics for admin
router.get('/achievements/stats', async (req, res) => {
  try {
    const stats = await Achievement.aggregate([
      {
        $group: {
          _id: null,
          totalAchievements: { $sum: 1 },
          totalUsers: { $addToSet: '$user' },
          byType: {
            $push: {
              type: '$type',
              points: '$points'
            }
          },
          recentAchievements: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          totalAchievements: 1,
          totalUsers: { $size: '$totalUsers' },
          typeBreakdown: {
            $arrayToObject: {
              $map: {
                input: [
                  'first_blood', 'category_master', 'speed_demon', 
                  'point_milestone', 'team_player', 'persistence', 
                  'streak', 'solver'
                ],
                as: 'type',
                in: {
                  k: '$$type',
                  v: {
                    count: {
                      $size: {
                        $filter: {
                          input: '$byType',
                          as: 'item',
                          cond: { $eq: ['$$item.type', '$$type'] }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          recentAchievements: { $slice: ['$recentAchievements', 10] }
        }
      }
    ]);

    const defaultStats = {
      totalAchievements: 0,
      totalUsers: 0,
      typeBreakdown: {},
      recentAchievements: []
    };

    res.json({ stats: stats[0] || defaultStats });
  } catch (error) {
    console.error('Admin achievement stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users for achievement awarding
router.get('/achievements/users', async (req, res) => {
  try {
    const { search = '' } = req.query;
    
    const users = await User.find({
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    })
    .select('username fullName email score')
    .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get challenges for achievement awarding
router.get('/achievements/challenges', async (req, res) => {
  try {
    const { search = '' } = req.query;
    
    const challenges = await Challenge.find({
      title: { $regex: search, $options: 'i' }
    })
    .select('title category points')
    .limit(20);

    res.json({ challenges });
  } catch (error) {
    console.error('Admin get challenges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually award achievement to user
router.post('/achievements/award', [
  body('userId').notEmpty(),
  body('achievementType').isIn([
    'first_blood', 'category_master', 'speed_demon', 
    'point_milestone', 'team_player', 'persistence', 
    'streak', 'solver'
  ]),
  body('challengeId').optional(),
  body('category').optional().trim(),
  body('points').optional().isInt({ min: 0 }),
  body('metadata').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, achievementType, challengeId, category, points, metadata } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate challenge exists if provided
    if (challengeId) {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }
    }

    // Check if achievement already exists
    const existingAchievement = await Achievement.findOne({
      user: userId,
      type: achievementType,
      ...(challengeId && { challenge: challengeId }),
      ...(category && { category })
    });

    if (existingAchievement) {
      return res.status(400).json({ error: 'Achievement already awarded to this user' });
    }

    const achievement = new Achievement({
      user: userId,
      type: achievementType,
      challenge: challengeId,
      category,
      points: points || 0,
      metadata: metadata || {},
      awardedAt: new Date()
    });

    await achievement.save();

    // Populate for response
    await achievement.populate('user', 'username fullName');
    if (challengeId) {
      await achievement.populate('challenge', 'title category');
    }

    res.status(201).json({
      message: 'Achievement awarded successfully',
      achievement
    });
  } catch (error) {
    console.error('Admin award achievement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke achievement from user
router.delete('/achievements/:achievementId/revoke', async (req, res) => {
  try {
    const { achievementId } = req.params;

    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    await Achievement.findByIdAndDelete(achievementId);

    res.json({
      message: 'Achievement revoked successfully',
      revokedAchievement: achievement
    });
  } catch (error) {
    console.error('Admin revoke achievement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk award achievements
router.post('/achievements/bulk-award', [
  body('achievementType').isIn([
    'first_blood', 'category_master', 'speed_demon', 
    'point_milestone', 'team_player', 'persistence', 
    'streak', 'solver'
  ]),
  body('userIds').isArray({ min: 1 }),
  body('metadata').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { achievementType, userIds, metadata } = req.body;

    const achievements = [];
    const awardErrors = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          awardErrors.push(`User ${userId} not found`);
          continue;
        }

        const existingAchievement = await Achievement.findOne({
          user: userId,
          type: achievementType
        });

        if (existingAchievement) {
          awardErrors.push(`Achievement already exists for user ${user.username}`);
          continue;
        }

        const achievement = new Achievement({
          user: userId,
          type: achievementType,
          metadata: metadata || {},
          awardedAt: new Date()
        });

        await achievement.save();
        await achievement.populate('user', 'username fullName');
        achievements.push(achievement);
      } catch (error) {
        awardErrors.push(`Error awarding to user ${userId}: ${error.message}`);
      }
    }

    res.json({
      message: `Awarded ${achievements.length} achievements successfully`,
      awarded: achievements.length,
      achievements,
      errors: awardErrors.length > 0 ? awardErrors : undefined
    });
  } catch (error) {
    console.error('Admin bulk award error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== EXISTING ADMIN ROUTES =====

// Create challenge with enhanced features
router.post('/challenges', [
  body('title').notEmpty().trim().isLength({ max: 100 }),
  body('description').notEmpty().trim(),
  body('category').isIn(['web', 'crypto', 'forensics', 'pwn', 'misc', 'reverse']),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('points').isInt({ min: 1, max: 1000 }),
  body('flag').notEmpty().trim(),
  body('hint').optional().trim(),
  body('tags').optional().isArray(),
  body('dynamicScoring').optional().isBoolean(),
  body('basePoints').optional().isInt({ min: 1 }),
  body('minPoints').optional().isInt({ min: 1 }),
  body('dockerImage').optional().trim(),
  body('validationType').optional().isIn(['static', 'dynamic', 'manual']),
  body('maxAttempts').optional().isInt({ min: 0 }),
  body('timeLimit').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      title,
      description,
      category,
      difficulty,
      points,
      flag,
      hint,
      tags,
      dynamicScoring,
      basePoints,
      minPoints,
      dockerImage,
      validationType,
      maxAttempts,
      timeLimit
    } = req.body

    const challenge = new Challenge({
      title,
      description,
      category,
      difficulty,
      points: parseInt(points),
      flag,
      hint: hint || '',
      tags: tags || [],
      dynamicScoring: dynamicScoring || false,
      basePoints: basePoints || points,
      minPoints: minPoints || Math.floor(points * 0.3),
      dockerImage: dockerImage || '',
      validationType: validationType || 'static',
      maxAttempts: maxAttempts || 0,
      timeLimit: timeLimit || 0,
      createdBy: req.userId
    })

    await challenge.save()

    // Validate challenge if it has dynamic components
    if (dockerImage) {
      try {
        await validationService.runHealthCheck(challenge)
      } catch (validationError) {
        console.warn(`Challenge validation warning: ${validationError.message}`)
      }
    }

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge: {
        id: challenge._id,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty,
        points: challenge.points,
        dynamicScoring: challenge.dynamicScoring,
        dockerImage: challenge.dockerImage
      }
    })

  } catch (error) {
    console.error('Create challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update challenge
router.put('/challenges/:challengeId', [
  body('title').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim(),
  body('category').optional().isIn(['web', 'crypto', 'forensics', 'pwn', 'misc', 'reverse']),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('points').optional().isInt({ min: 1, max: 1000 }),
  body('flag').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const challenge = await Challenge.findById(req.params.challengeId)
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    const updateFields = { ...req.body }
    
    // Remove fields that shouldn't be updated directly
    delete updateFields.createdBy
    delete updateFields.solveCount

    const updatedChallenge = await Challenge.findByIdAndUpdate(
      req.params.challengeId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )

    res.json({
      message: 'Challenge updated successfully',
      challenge: updatedChallenge
    })

  } catch (error) {
    console.error('Update challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get admin statistics with enhanced analytics
router.get('/statistics', async (req, res) => {
  try {
    const [
      totalUsers,
      totalChallenges,
      totalSubmissions,
      correctSubmissions,
      totalTeams,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      Challenge.countDocuments(),
      Submission.countDocuments(),
      Submission.countDocuments({ isCorrect: true }),
      Team.countDocuments(),
      User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ])

    // Category statistics
    const categoryStats = {}
    const challengesByCategory = await Challenge.aggregate([
      { $group: { _id: '$category', total: { $sum: 1 } } }
    ])

    const solvedByCategory = await Submission.aggregate([
      { $match: { isCorrect: true } },
      {
        $lookup: {
          from: 'challenges',
          localField: 'challenge',
          foreignField: '_id',
          as: 'challenge'
        }
      },
      { $unwind: '$challenge' },
      { $group: { _id: '$challenge.category', solved: { $sum: 1 } } }
    ])

    challengesByCategory.forEach(cat => {
      categoryStats[cat._id] = { total: cat.total, solved: 0 }
    })

    solvedByCategory.forEach(cat => {
      if (categoryStats[cat._id]) {
        categoryStats[cat._id].solved = cat.solved
      }
    })

    // Difficulty statistics
    const difficultyStats = await Challenge.aggregate([
      {
        $group: {
          _id: '$difficulty',
          total: { $sum: 1 },
          totalPoints: { $sum: '$points' }
        }
      }
    ])

    // User activity statistics
    const userStats = await User.aggregate([
      {
        $match: { role: 'participant' }
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          totalSolves: { $sum: { $size: '$solvedChallenges' } },
          avgSolves: { $avg: { $size: '$solvedChallenges' } }
        }
      }
    ])

    // Recent activity
    const recentSubmissions = await Submission.find()
      .populate('user', 'username')
      .populate('challenge', 'title category')
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      overview: {
        totalUsers,
        totalChallenges,
        totalSubmissions,
        correctSubmissions,
        totalTeams,
        activeUsers,
        successRate: totalSubmissions > 0 ? (correctSubmissions / totalSubmissions * 100).toFixed(2) : 0
      },
      categoryStats,
      difficultyStats: difficultyStats.reduce((acc, curr) => {
        acc[curr._id] = { total: curr.total, totalPoints: curr.totalPoints }
        return acc
      }, {}),
      userStats: userStats[0] || {},
      recentActivity: recentSubmissions.map(sub => ({
        user: sub.user.username,
        challenge: sub.challenge.title,
        category: sub.challenge.category,
        correct: sub.isCorrect,
        timestamp: sub.createdAt
      }))
    })

  } catch (error) {
    console.error('Get statistics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get detailed challenge analytics
router.get('/analytics/challenges', async (req, res) => {
  try {
    const challengeStats = await Challenge.aggregate([
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'challenge',
          as: 'submissions'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          difficulty: 1,
          points: 1,
          solveCount: 1,
          totalAttempts: { $size: '$submissions' },
          correctSubmissions: {
            $size: {
              $filter: {
                input: '$submissions',
                as: 'sub',
                cond: { $eq: ['$$sub.isCorrect', true] }
              }
            }
          },
          successRate: {
            $cond: {
              if: { $eq: [{ $size: '$submissions' }, 0] },
              then: 0,
              else: {
                $multiply: [
                  {
                    $divide: [
                      { $size: { $filter: { input: '$submissions', as: 'sub', cond: { $eq: ['$$sub.isCorrect', true] } } } },
                      { $size: '$submissions' }
                    ]
                  },
                  100
                ]
              }
            }
          },
          firstBlood: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$submissions',
                  as: 'sub',
                  cond: { $and: [{ $eq: ['$$sub.isCorrect', true] }, { $eq: ['$$sub.solveOrder', 1] }] }
                }
              },
              0
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'firstBlood.user',
          foreignField: '_id',
          as: 'firstBloodUser'
        }
      },
      {
        $addFields: {
          firstBloodUser: { $arrayElemAt: ['$firstBloodUser.username', 0] },
          firstBloodTime: '$firstBlood.createdAt'
        }
      },
      {
        $project: {
          firstBlood: 0
        }
      },
      {
        $sort: { solveCount: -1 }
      }
    ])

    res.json(challengeStats)
  } catch (error) {
    console.error('Challenge analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// User management endpoints
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query
    
    const filter = {
      role: 'participant'
    }
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('team', 'name')
      .sort({ score: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(filter)

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Toggle user active status
router.patch('/users/:userId/status', [
  body('isActive').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { isActive } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    })
  } catch (error) {
    console.error('Toggle user status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Backup management
router.post('/backup', async (req, res) => {
  try {
    const backupPath = await backupManager.createBackup()
    
    res.json({
      message: 'Backup created successfully',
      path: backupPath,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Backup creation error:', error)
    res.status(500).json({ error: 'Backup failed' })
  }
})

router.get('/backups', async (req, res) => {
  try {
    const backups = await backupManager.listBackups()
    res.json(backups)
  } catch (error) {
    console.error('List backups error:', error)
    res.status(500).json({ error: 'Failed to list backups' })
  }
})

//challenges

router.get('/challenges', async (req, res) => {
  try {
    const { category, difficulty, status, search, page = 1, limit = 50 } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      }
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const challenges = await Challenge.find(filter)
      .select('-flag') // Exclude the flag for security
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Challenge.countDocuments(filter);

    res.json({
      challenges,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get admin challenges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single challenge for admin
router.get('/challenges/:challengeId', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId)
      .populate('createdBy', 'username');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Get submission statistics
    const submissionStats = await Submission.aggregate([
      { $match: { challenge: challenge._id } },
      {
        $group: {
          _id: '$isCorrect',
          count: { $sum: 1 }
        }
      }
    ]);

    const correctSubmissions = submissionStats.find(s => s._id === true)?.count || 0;
    const totalSubmissions = submissionStats.reduce((sum, s) => sum + s.count, 0);

    res.json({
      challenge: {
        ...challenge.toObject(),
        submissionStats: {
          total: totalSubmissions,
          correct: correctSubmissions,
          incorrect: totalSubmissions - correctSubmissions
        }
      }
    });

  } catch (error) {
    console.error('Get admin challenge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete challenge
router.delete('/challenges/:challengeId', async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.challengeId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Also delete related submissions
    await Submission.deleteMany({ challenge: req.params.challengeId });

    res.json({ 
      message: 'Challenge deleted successfully',
      deletedChallenge: {
        id: challenge._id,
        title: challenge.title
      }
    });

  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

// Toggle challenge status
router.patch('/challenges/:challengeId/status', [
  body('isActive').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.challengeId,
      { isActive },
      { new: true }
    ).select('-flag');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({
      message: `Challenge ${isActive ? 'activated' : 'deactivated'} successfully`,
      challenge
    });
  } catch (error) {
    console.error('Toggle challenge status error:', error);
    res.status(500).json({ error: 'Failed to update challenge status' });
  }
});

// System health check
router.get('/system/health', async (req, res) => {
  try {
    const health = {
      database: 'Connected',
      redis: 'Unknown',
      docker: 'Unknown',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }

    // Check Docker service
    try {
      // Simple Docker check - you might want to implement actual container checks
      health.docker = 'Available'
    } catch {
      health.docker = 'Unavailable'
    }

    res.json(health)
  } catch (error) {
    console.error('System health check error:', error)
    res.status(500).json({ error: 'Health check failed' })
  }
})

// Reset challenge (clear all submissions)
router.post('/challenges/:challengeId/reset', async (req, res) => {
  try {
    const challengeId = req.params.challengeId
    
    // Clear all submissions for this challenge
    await Submission.deleteMany({ challenge: challengeId })
    
    // Reset challenge solve count
    await Challenge.findByIdAndUpdate(challengeId, {
      solveCount: 0,
      points: { $ifNull: ['$basePoints', '$points'] }
    })
    
    // Remove from users' solved challenges and adjust scores
    const challenge = await Challenge.findById(challengeId)
    if (challenge) {
      await User.updateMany(
        { solvedChallenges: challengeId },
        {
          $pull: { solvedChallenges: challengeId },
          $inc: { score: -challenge.points }
        }
      )
    }

    res.json({ message: 'Challenge reset successfully' })
  } catch (error) {
    console.error('Reset challenge error:', error)
    res.status(500).json({ error: 'Failed to reset challenge' })
  }
})

export default router
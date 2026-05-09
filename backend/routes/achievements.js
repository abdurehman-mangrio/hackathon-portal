import express from 'express';
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// User routes
// Get user's own achievements
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const achievements = await Achievement.find({ user: req.userId })
      .populate('challenge', 'title category points')
      .sort({ awardedAt: -1 });

    res.json({ achievements });
  } catch (error) {
    console.error('Get my achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;

    let pipeline = [
      {
        $group: {
          _id: '$user',
          totalAchievements: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          achievements: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$user._id',
            username: '$user.username',
            fullName: '$user.fullName',
            score: '$user.score'
          },
          totalAchievements: 1,
          totalPoints: 1,
          achievements: 1
        }
      },
      {
        $sort: { totalPoints: -1, totalAchievements: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    if (type) {
      pipeline.unshift({
        $match: { type }
      });
    }

    const leaderboard = await Achievement.aggregate(pipeline);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get achievement types
router.get('/types', authMiddleware, async (req, res) => {
  try {
    const types = [
      {
        type: 'first_blood',
        name: 'First Blood',
        description: 'First to solve a challenge',
        points: 50
      },
      {
        type: 'solver',
        name: 'Solver',
        description: 'Successfully solved a challenge',
        points: 10
      },
      {
        type: 'category_master',
        name: 'Category Master',
        description: 'Solved all challenges in a category',
        points: 100
      },
      {
        type: 'speed_demon',
        name: 'Speed Demon',
        description: 'Solved a challenge very quickly',
        points: 25
      },
      {
        type: 'persistence',
        name: 'Persistence',
        description: 'Solved a challenge after multiple attempts',
        points: 15
      },
      {
        type: 'streak',
        name: 'Streak',
        description: 'Solved multiple challenges in a row',
        points: 20
      },
      {
        type: 'point_milestone',
        name: 'Point Milestone',
        description: 'Reached a score milestone',
        points: 30
      },
      {
        type: 'team_player',
        name: 'Team Player',
        description: 'Contributed to team success',
        points: 40
      }
    ];

    res.json({ types });
  } catch (error) {
    console.error('Get achievement types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent achievements
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const achievements = await Achievement.find()
      .populate('user', 'username fullName')
      .populate('challenge', 'title category')
      .sort({ awardedAt: -1 })
      .limit(parseInt(limit));

    res.json({ achievements });
  } catch (error) {
    console.error('Get recent achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check for new achievements (trigger achievement checking)
router.post('/check', authMiddleware, async (req, res) => {
  try {
    // This would typically trigger the achievement service to check for new achievements
    // For now, return a simple response
    res.json({
      message: 'Achievement check completed',
      newAchievements: []
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user achievement stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Achievement.aggregate([
      {
        $match: { user: userId }
      },
      {
        $group: {
          _id: null,
          totalAchievements: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          byType: {
            $push: {
              type: '$type',
              points: '$points'
            }
          }
        }
      },
      {
        $project: {
          totalAchievements: 1,
          totalPoints: 1,
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
                    },
                    totalPoints: {
                      $sum: {
                        $filter: {
                          input: '$byType.points',
                          as: 'point',
                          cond: { $eq: ['$$item.type', '$$type'] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    const defaultStats = {
      totalAchievements: 0,
      totalPoints: 0,
      typeBreakdown: {}
    };

    res.json({ stats: stats[0] || defaultStats });
  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes
// Get all achievements with pagination and filtering
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
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
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
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
                    },
                    totalPoints: {
                      $sum: {
                        $filter: {
                          input: '$byType.points',
                          as: 'point',
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
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
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
router.get('/challenges', authMiddleware, adminMiddleware, async (req, res) => {
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
router.post('/award', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, achievementType, challengeId, category, points, metadata } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    await achievement.populate('challenge', 'title category');

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
router.delete('/:achievementId/revoke', authMiddleware, adminMiddleware, async (req, res) => {
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
router.post('/bulk-award', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { achievementType, userIds, metadata } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    const achievements = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          errors.push(`User ${userId} not found`);
          continue;
        }

        const existingAchievement = await Achievement.findOne({
          user: userId,
          type: achievementType
        });

        if (existingAchievement) {
          errors.push(`Achievement already exists for user ${user.username}`);
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
        errors.push(`Error awarding to user ${userId}: ${error.message}`);
      }
    }

    res.json({
      message: `Awarded ${achievements.length} achievements successfully`,
      awarded: achievements.length,
      achievements,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Admin bulk award error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
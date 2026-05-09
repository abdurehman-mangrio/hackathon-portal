import express from 'express'
import User from '../models/User.js'
import Team from '../models/Team.js'

const router = express.Router()

// Get main leaderboard
router.get('/', async (req, res) => {
  try {
    const { timeRange = 'all' } = req.query

    // For now, timeRange is not implemented in aggregation, but we can add filtering later
    const leaderboard = await User.aggregate([
      {
        $match: {
          role: 'participant',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'submissions',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] }, isCorrect: true } },
            { $count: 'count' }
          ],
          as: 'submissionCount'
        }
      },
      {
        $lookup: {
          from: 'achievements',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
            { $count: 'count' }
          ],
          as: 'achievementCount'
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'team',
          foreignField: '_id',
          as: 'teamInfo'
        }
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          score: 1,
          solvedChallenges: 1,
          solvedCount: { $size: '$solvedChallenges' },
          submissionCount: { $arrayElemAt: ['$submissionCount.count', 0] },
          achievementCount: { $arrayElemAt: ['$achievementCount.count', 0] },
          team: { $arrayElemAt: ['$teamInfo.name', null] },
          lastSolve: 1,
          streak: 1,
          statistics: 1,
          createdAt: 1
        }
      },
      {
        $sort: {
          score: -1,
          lastSolve: 1,
          createdAt: 1
        }
      },
      {
        $limit: 50
      }
    ])

    // Add ranks
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      id: user._id,
      rank: index + 1,
      username: user.username,
      fullName: user.fullName,
      totalPoints: user.score || 0,
      solvedChallenges: user.solvedCount || 0,
      submissionCount: user.submissionCount || 0,
      achievementCount: user.achievementCount || 0,
      team: user.team,
      lastSolve: user.lastSolve,
      streak: user.streak?.current || 0,
      favoriteCategory: user.statistics?.favoriteCategory,
      joinDate: user.createdAt
    }))

    res.json(leaderboardWithRank)
  } catch (error) {
    console.error('Leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user leaderboard with enhanced data
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query

    const leaderboard = await User.aggregate([
      {
        $match: {
          role: 'participant',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'submissions',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] }, isCorrect: true } },
            { $count: 'count' }
          ],
          as: 'submissionCount'
        }
      },
      {
        $lookup: {
          from: 'achievements',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
            { $count: 'count' }
          ],
          as: 'achievementCount'
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'team',
          foreignField: '_id',
          as: 'teamInfo'
        }
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          score: 1,
          solvedChallenges: 1,
          solvedCount: { $size: '$solvedChallenges' },
          submissionCount: { $arrayElemAt: ['$submissionCount.count', 0] },
          achievementCount: { $arrayElemAt: ['$achievementCount.count', 0] },
          team: { $arrayElemAt: ['$teamInfo.name', null] },
          lastSolve: 1,
          streak: 1,
          statistics: 1,
          createdAt: 1
        }
      },
      {
        $sort: {
          score: -1,
          lastSolve: 1,
          createdAt: 1
        }
      },
      {
        $skip: parseInt(offset)
      },
      {
        $limit: parseInt(limit)
      }
    ])

    // Add ranks
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      rank: parseInt(offset) + index + 1,
      username: user.username,
      fullName: user.fullName,
      score: user.score || 0,
      solvedCount: user.solvedCount || 0,
      submissionCount: user.submissionCount || 0,
      achievementCount: user.achievementCount || 0,
      team: user.team,
      lastSolve: user.lastSolve,
      streak: user.streak?.current || 0,
      favoriteCategory: user.statistics?.favoriteCategory,
      joinDate: user.createdAt
    }))

    // Get total count for pagination
    const totalUsers = await User.countDocuments({ 
      role: 'participant', 
      isActive: true 
    })

    res.json({
      leaderboard: leaderboardWithRank,
      pagination: {
        total: totalUsers,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + leaderboard.length) < totalUsers
      }
    })
  } catch (error) {
    console.error('User leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get team leaderboard
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'memberDetails'
        }
      },
      {
        $addFields: {
          memberCount: { $size: '$members' },
          totalSolves: { $size: '$solvedChallenges' },
          averageScore: { $divide: ['$score', { $size: '$members' }] }
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          score: 1,
          memberCount: 1,
          totalSolves: 1,
          averageScore: 1,
          captain: 1,
          members: {
            $map: {
              input: '$memberDetails',
              as: 'member',
              in: {
                username: '$$member.username',
                score: '$$member.score'
              }
            }
          },
          createdAt: 1
        }
      },
      {
        $sort: {
          score: -1,
          averageScore: -1,
          createdAt: 1
        }
      }
    ])

    const teamsWithRank = teams.map((team, index) => ({
      rank: index + 1,
      name: team.name,
      description: team.description,
      score: team.score,
      memberCount: team.memberCount,
      totalSolves: team.totalSolves,
      averageScore: Math.round(team.averageScore),
      members: team.members,
      createdAt: team.createdAt
    }))

    res.json(teamsWithRank)
  } catch (error) {
    console.error('Team leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get category-based leaderboard
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params
    const { limit = 20 } = req.query

    const categoryLeaderboard = await User.aggregate([
      {
        $match: {
          role: 'participant',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'submissions',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] }, isCorrect: true } },
            {
              $lookup: {
                from: 'challenges',
                localField: 'challenge',
                foreignField: '_id',
                as: 'challenge'
              }
            },
            { $unwind: '$challenge' },
            { $match: { 'challenge.category': category } }
          ],
          as: 'categorySubmissions'
        }
      },
      {
        $addFields: {
          categoryScore: {
            $sum: '$categorySubmissions.challenge.points'
          },
          categorySolves: {
            $size: '$categorySubmissions'
          }
        }
      },
      {
        $match: {
          categorySolves: { $gt: 0 }
        }
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          categoryScore: 1,
          categorySolves: 1,
          totalScore: '$score'
        }
      },
      {
        $sort: {
          categoryScore: -1,
          categorySolves: -1
        }
      },
      {
        $limit: parseInt(limit)
      }
    ])

    const leaderboardWithRank = categoryLeaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      fullName: user.fullName,
      categoryScore: user.categoryScore,
      categorySolves: user.categorySolves,
      totalScore: user.totalScore
    }))

    res.json(leaderboardWithRank)
  } catch (error) {
    console.error('Category leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get badge leaderboard
router.get('/badges', async (req, res) => {
  try {
    const badgeLeaderboard = await User.aggregate([
      {
        $match: {
          role: 'participant',
          isActive: true
        }
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          score: 1,
          badgeCount: { $size: '$badges' },
          badges: 1
        }
      },
      {
        $sort: {
          badgeCount: -1,
          score: -1
        }
      },
      {
        $limit: 20
      }
    ])

    const leaderboardWithRank = badgeLeaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      fullName: user.fullName,
      badgeCount: user.badgeCount,
      score: user.score
    }))

    res.json(leaderboardWithRank)
  } catch (error) {
    console.error('Badge leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
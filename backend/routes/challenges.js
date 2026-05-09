import express from 'express'
import { body, validationResult } from 'express-validator'
import Challenge from '../models/Challenge.js'
import Submission from '../models/Submission.js'
import User from '../models/User.js'
import { authMiddleware } from '../middleware/auth.js'
import { challengeSpecificRateLimit } from '../middleware/advancedRateLimit.js'
import achievementService from '../services/achievementService.js'
import scoringService from '../services/scoringService.js'
import badgeService from '../services/badgeService.js'
import socketService from '../services/socketService.js'

const router = express.Router()

// Get all challenges with enhanced filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, difficulty, status, search } = req.query
    
    let filter = { isActive: true }
    
    // Apply filters
    if (category && category !== 'all') {
      filter.category = category
    }
    
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    const challenges = await Challenge.find(filter)
      .select('title description category difficulty points tags solveCount dynamicScoring attachments dockerImage createdAt')
      .sort({ category: 1, difficulty: 1, points: 1 })
    
    // Get user's solved challenges and progress
    const [userSubmissions, userProgress] = await Promise.all([
      Submission.find({ 
        user: req.userId,
        isCorrect: true 
      }).select('challenge'),
      
      (await import('../models/UserChallengeProgress.js')).default.find({
        user: req.userId
      })
    ])

    const solvedChallengeIds = new Set(userSubmissions.map(sub => sub.challenge.toString()))
    const progressMap = new Map(userProgress.map(p => [p.challenge.toString(), p]))

    const challengesWithStatus = challenges.map(challenge => {
      const progress = progressMap.get(challenge._id.toString())
      const solved = solvedChallengeIds.has(challenge._id.toString())
      
      return {
        id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        points: challenge.points,
        currentPoints: challenge.currentPoints,
        tags: challenge.tags,
        solveCount: challenge.solveCount,
        dynamicScoring: challenge.dynamicScoring,
        attachments: challenge.attachments,
        dockerImage: challenge.dockerImage,
        createdAt: challenge.createdAt,
        solved,
        progress: progress ? {
          attempts: progress.attempts,
          timeSpent: progress.timeSpent,
          hintsUsed: progress.hintsUsed.length,
          startedAt: progress.startedAt
        } : null
      }
    })

    // Apply status filter after building the data
    let filteredChallenges = challengesWithStatus
    if (status === 'solved') {
      filteredChallenges = filteredChallenges.filter(c => c.solved)
    } else if (status === 'unsolved') {
      filteredChallenges = filteredChallenges.filter(c => !c.solved)
    }

    res.json(filteredChallenges)
  } catch (error) {
    console.error('Get challenges error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single challenge details
router.get('/:challengeId', authMiddleware, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId)
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    // Get user's progress
    const [submission, progress] = await Promise.all([
      Submission.findOne({
        user: req.userId,
        challenge: req.params.challengeId,
        isCorrect: true
      }),
      
      (await import('../models/UserChallengeProgress.js')).default.findOne({
        user: req.userId,
        challenge: req.params.challengeId
      })
    ])

    const solved = !!submission

    // Get hints (without revealing content until purchased)
    const Hint = await import('../models/Hint.js')
    const hints = await Hint.default.find({
      challenge: req.params.challengeId,
      isActive: true
    }).select('level cost cooldown')

    // Get user's purchased hints
    const UserHint = await import('../models/UserHint.js')
    const userHints = await UserHint.default.find({
      user: req.userId,
      challenge: req.params.challengeId
    }).populate('hint', 'level content')

    res.json({
      challenge: {
        id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        points: challenge.points,
        currentPoints: challenge.currentPoints,
        tags: challenge.tags,
        attachments: challenge.attachments,
        dockerImage: challenge.dockerImage,
        validationType: challenge.validationType,
        maxAttempts: challenge.maxAttempts,
        timeLimit: challenge.timeLimit,
        createdAt: challenge.createdAt
      },
      solved,
      submission: solved ? {
        submittedAt: submission.createdAt,
        pointsAwarded: submission.pointsAwarded,
        solveOrder: submission.solveOrder
      } : null,
      progress: progress ? {
        attempts: progress.attempts,
        timeSpent: progress.timeSpent,
        startedAt: progress.startedAt
      } : null,
      hints: hints.map(hint => ({
        level: hint.level,
        cost: hint.cost,
        cooldown: hint.cooldown,
        purchased: userHints.some(uh => uh.hint.level === hint.level),
        content: userHints.find(uh => uh.hint.level === hint.level)?.hint.content
      }))
    })

  } catch (error) {
    console.error('Get challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Submit flag with enhanced features
router.post('/:challengeId/submit', [
  authMiddleware,
  challengeSpecificRateLimit(10, 60), // 10 attempts per hour
  body('flag').notEmpty().trim().withMessage('Flag is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { challengeId } = req.params
    const { flag } = req.body
    const userId = req.userId

    // Check if already solved
    const existingSubmission = await Submission.findOne({
      user: userId,
      challenge: challengeId,
      isCorrect: true
    })

    if (existingSubmission) {
      return res.status(400).json({ error: 'Challenge already solved' })
    }

    // Get challenge
    const challenge = await Challenge.findById(challengeId)
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    // Check max attempts
    if (challenge.maxAttempts > 0) {
      const attemptCount = await Submission.countDocuments({
        user: userId,
        challenge: challengeId
      })
      
      if (attemptCount >= challenge.maxAttempts) {
        return res.status(400).json({ error: 'Maximum attempts reached for this challenge' })
      }
    }

    // Verify flag
    const isCorrect = flag === challenge.flag

    // Get client IP properly
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress

    // Record submission
    const submission = new Submission({
      user: userId,
      challenge: challengeId,
      flagSubmitted: flag,
      isCorrect,
      ip: clientIp,
      userAgent: req.get('User-Agent')
    })

    await submission.save()

    // Update user progress
    const UserChallengeProgress = await import('../models/UserChallengeProgress.js')
    let progress = await UserChallengeProgress.default.findOne({
      user: userId,
      challenge: challengeId
    })

    if (!progress) {
      progress = new UserChallengeProgress.default({
        user: userId,
        challenge: challengeId
      })
    }

    progress.attempts += 1
    progress.lastAttempt = new Date()

    if (isCorrect) {
      const pointsAwarded = challenge.currentPoints
      
      // Update challenge solve count
      challenge.solveCount += 1
      if (challenge.dynamicScoring) {
        challenge.points = challenge.currentPoints
      }
      await challenge.save()

      // Update submission with points
      submission.pointsAwarded = pointsAwarded
      await submission.save()

      // Update user
      const user = await User.findById(userId)
      user.solvedChallenges.push(challengeId)
      user.score += pointsAwarded
      user.updateStreak()
      user.statistics.correctSubmissions += 1
      user.statistics.totalAttempts += 1
      
      // Update favorite category
      const categorySolves = await Submission.aggregate([
        { $match: { user: userId, isCorrect: true } },
        {
          $lookup: {
            from: 'challenges',
            localField: 'challenge',
            foreignField: '_id',
            as: 'challenge'
          }
        },
        { $unwind: '$challenge' },
        { $group: { _id: '$challenge.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ])
      
      if (categorySolves.length > 0) {
        user.statistics.favoriteCategory = categorySolves[0]._id
      }
      
      await user.save()

      // Update progress
      progress.completed = true
      progress.completedAt = new Date()
      await progress.save()

      // Check achievements
      await achievementService.checkFirstBlood(challengeId, userId)
      await achievementService.checkCategoryMaster(userId, challenge.category)
      await achievementService.checkPointMilestones(userId)

      // Check badges
      await badgeService.checkAndAwardBadges(userId)

      // Update scoring if dynamic
      if (challenge.dynamicScoring) {
        await scoringService.updateChallengePoints(challengeId)
      }

      // Broadcast solve notification
      const isFirstBlood = submission.solveOrder === 1
      socketService.broadcastChallengeSolve(user, challenge, isFirstBlood)

      res.json({
        correct: true,
        message: isFirstBlood ? '🎉 First Blood! Correct flag!' : '✅ Correct flag! Challenge completed!',
        points: pointsAwarded,
        solveOrder: submission.solveOrder,
        isFirstBlood
      })

    } else {
      // Incorrect submission
      await progress.save()
      
      // Update user statistics
      await User.findByIdAndUpdate(userId, {
        $inc: { 'statistics.totalAttempts': 1 }
      })

      res.json({
        correct: false,
        message: '❌ Incorrect flag!',
        attempts: progress.attempts,
        maxAttempts: challenge.maxAttempts
      })
    }

  } catch (error) {
    console.error('Submit flag error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start challenge (track time)
router.post('/:challengeId/start', authMiddleware, async (req, res) => {
  try {
    const UserChallengeProgress = await import('../models/UserChallengeProgress.js')
    
    let progress = await UserChallengeProgress.default.findOne({
      user: req.userId,
      challenge: req.params.challengeId
    })

    if (!progress) {
      progress = new UserChallengeProgress.default({
        user: req.userId,
        challenge: req.params.challengeId,
        startedAt: new Date()
      })
      await progress.save()
    }

    res.json({
      message: 'Challenge started',
      progress: {
        startedAt: progress.startedAt,
        attempts: progress.attempts
      }
    })

  } catch (error) {
    console.error('Start challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
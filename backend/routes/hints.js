import express from 'express'
import { body, validationResult } from 'express-validator'
import Hint from '../models/Hint.js'
import UserHint from '../models/UserHint.js'
import User from '../models/User.js'
import Challenge from '../models/Challenge.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Get available hints for a challenge
router.get('/challenge/:challengeId', authMiddleware, async (req, res) => {
  try {
    const { challengeId } = req.params
    const userId = req.userId

    // Get all hints for the challenge
    const hints = await Hint.find({
      challenge: challengeId,
      isActive: true
    }).sort({ level: 1 })

    // Get user's purchased hints
    const userHints = await UserHint.find({
      user: userId,
      challenge: challengeId
    }).populate('hint')

    // Format response
    const hintsWithPurchaseStatus = hints.map(hint => {
      const purchased = userHints.find(uh => uh.hint._id.toString() === hint._id.toString())
      return {
        id: hint._id,
        level: hint.level,
        cost: hint.cost,
        cooldown: hint.cooldown,
        purchased: !!purchased,
        content: purchased ? hint.content : null,
        purchasedAt: purchased ? purchased.usedAt : null
      }
    })

    res.json({ hints: hintsWithPurchaseStatus })
  } catch (error) {
    console.error('Get hints error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Purchase a hint
router.post('/purchase', [
  authMiddleware,
  body('hintId').isMongoId(),
  body('challengeId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { hintId, challengeId } = req.body
    const userId = req.userId

    // Get hint details
    const hint = await Hint.findOne({
      _id: hintId,
      challenge: challengeId,
      isActive: true
    })

    if (!hint) {
      return res.status(404).json({ error: 'Hint not found' })
    }

    // Check if user already purchased this hint
    const existingPurchase = await UserHint.findOne({
      user: userId,
      hint: hintId
    })

    if (existingPurchase) {
      return res.status(400).json({ error: 'Hint already purchased' })
    }

    // Check cooldown for previous hint purchases
    const lastPurchase = await UserHint.findOne({
      user: userId,
      challenge: challengeId
    }).sort({ usedAt: -1 })

    if (lastPurchase) {
      const timeSinceLastPurchase = Date.now() - lastPurchase.usedAt.getTime()
      const cooldownRemaining = hint.cooldown * 1000 - timeSinceLastPurchase

      if (cooldownRemaining > 0) {
        const minutes = Math.ceil(cooldownRemaining / (60 * 1000))
        return res.status(400).json({ 
          error: `Hint cooldown active. Please wait ${minutes} minute(s) before purchasing another hint.` 
        })
      }
    }

    // Check if user has enough points
    const user = await User.findById(userId)
    if (user.score < hint.cost) {
      return res.status(400).json({ 
        error: `Insufficient points. Hint costs ${hint.cost} but you have ${user.score}.` 
      })
    }

    // Check if user has solved the challenge
    const Submission = await import('../models/Submission.js')
    const isSolved = await Submission.default.exists({
      user: userId,
      challenge: challengeId,
      isCorrect: true
    })

    if (isSolved) {
      return res.status(400).json({ error: 'Cannot purchase hints for solved challenges' })
    }

    // Purchase the hint
    const userHint = new UserHint({
      user: userId,
      hint: hintId,
      challenge: challengeId,
      pointsDeducted: hint.cost
    })

    await userHint.save()

    // Deduct points from user
    user.score -= hint.cost
    await user.save()

    res.json({
      message: 'Hint purchased successfully',
      hint: {
        level: hint.level,
        content: hint.content,
        cost: hint.cost,
        pointsRemaining: user.score
      }
    })

  } catch (error) {
    console.error('Purchase hint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Create hint
router.post('/admin', [
  authMiddleware,
  adminMiddleware,
  body('challengeId').isMongoId(),
  body('level').isInt({ min: 1, max: 3 }),
  body('content').notEmpty().trim(),
  body('cost').isInt({ min: 0 }),
  body('cooldown').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { challengeId, level, content, cost, cooldown = 300 } = req.body

    // Check if challenge exists
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    // Check if hint level already exists for this challenge
    const existingHint = await Hint.findOne({
      challenge: challengeId,
      level: level
    })

    if (existingHint) {
      return res.status(400).json({ error: `Hint level ${level} already exists for this challenge` })
    }

    // Create hint
    const hint = new Hint({
      challenge: challengeId,
      level,
      content,
      cost,
      cooldown
    })

    await hint.save()

    res.status(201).json({
      message: 'Hint created successfully',
      hint: {
        id: hint._id,
        challenge: hint.challenge,
        level: hint.level,
        cost: hint.cost,
        cooldown: hint.cooldown
      }
    })

  } catch (error) {
    console.error('Create hint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Update hint
router.put('/admin/:hintId', [
  authMiddleware,
  adminMiddleware,
  body('content').optional().trim(),
  body('cost').optional().isInt({ min: 0 }),
  body('cooldown').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const hint = await Hint.findById(req.params.hintId)
    if (!hint) {
      return res.status(404).json({ error: 'Hint not found' })
    }

    const { content, cost, cooldown, isActive } = req.body
    const updates = {}

    if (content !== undefined) updates.content = content
    if (cost !== undefined) updates.cost = cost
    if (cooldown !== undefined) updates.cooldown = cooldown
    if (isActive !== undefined) updates.isActive = isActive

    const updatedHint = await Hint.findByIdAndUpdate(
      req.params.hintId,
      { $set: updates },
      { new: true }
    )

    res.json({
      message: 'Hint updated successfully',
      hint: updatedHint
    })

  } catch (error) {
    console.error('Update hint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get all hints for a challenge
router.get('/admin/challenge/:challengeId', [
  authMiddleware,
  adminMiddleware
], async (req, res) => {
  try {
    const hints = await Hint.find({ challenge: req.params.challengeId })
      .populate('challenge', 'title category')
      .sort({ level: 1 })

    // Get purchase statistics for each hint
    const hintsWithStats = await Promise.all(
      hints.map(async (hint) => {
        const purchaseCount = await UserHint.countDocuments({ hint: hint._id })
        const totalRevenue = purchaseCount * hint.cost

        return {
          ...hint.toObject(),
          purchaseCount,
          totalRevenue
        }
      })
    )

    res.json({ hints: hintsWithStats })
  } catch (error) {
    console.error('Get admin hints error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's hint purchase history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query

    const userHints = await UserHint.find({ user: req.userId })
      .populate('hint', 'level cost content')
      .populate('challenge', 'title category points')
      .sort({ usedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await UserHint.countDocuments({ user: req.userId })

    const history = userHints.map(uh => ({
      id: uh._id,
      challenge: {
        title: uh.challenge.title,
        category: uh.challenge.category,
        points: uh.challenge.points
      },
      hint: {
        level: uh.hint.level,
        cost: uh.hint.cost,
        content: uh.hint.content
      },
      purchasedAt: uh.usedAt,
      pointsDeducted: uh.pointsDeducted
    }))

    res.json({
      history,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get hint history error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get hint statistics for user
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId

    const stats = await UserHint.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: 'hints',
          localField: 'hint',
          foreignField: '_id',
          as: 'hint'
        }
      },
      { $unwind: '$hint' },
      {
        $group: {
          _id: null,
          totalHintsPurchased: { $sum: 1 },
          totalPointsSpent: { $sum: '$pointsDeducted' },
          hintsByLevel: {
            $push: {
              level: '$hint.level',
              cost: '$hint.cost'
            }
          }
        }
      },
      {
        $project: {
          totalHintsPurchased: 1,
          totalPointsSpent: 1,
          averageCost: { $round: [{ $divide: ['$totalPointsSpent', '$totalHintsPurchased'] }, 2] },
          levelBreakdown: {
            $arrayToObject: {
              $map: {
                input: [1, 2, 3],
                as: 'level',
                in: {
                  k: { $toString: '$$level' },
                  v: {
                    count: {
                      $size: {
                        $filter: {
                          input: '$hintsByLevel',
                          as: 'h',
                          cond: { $eq: ['$$h.level', '$$level'] }
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
    ])

    const defaultStats = {
      totalHintsPurchased: 0,
      totalPointsSpent: 0,
      averageCost: 0,
      levelBreakdown: { '1': { count: 0 }, '2': { count: 0 }, '3': { count: 0 } }
    }

    res.json({ stats: stats[0] || defaultStats })
  } catch (error) {
    console.error('Get hint stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
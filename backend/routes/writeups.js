import express from 'express'
import { body, validationResult } from 'express-validator'
import Writeup from '../models/Writeup.js'
import Challenge from '../models/Challenge.js'
import User from '../models/User.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// ===== SEARCH AND POPULAR ROUTES (MUST COME BEFORE DYNAMIC :writeupId ROUTE) =====

// Search writeups
router.get('/search', async (req, res) => {
  try {
    const { q, category, tags, page = 1, limit = 20, sort = 'rating' } = req.query

    const filter = { isPublic: true }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    }

    if (category) {
      filter['challenge.category'] = category
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags]
      filter.tags = { $in: tagArray }
    }

    // Dynamic sorting based on query param
    const sortOptions = {
      rating: { rating: -1, views: -1 },
      recent: { createdAt: -1 },
      views: { views: -1 }
    }
    const sortBy = sortOptions[sort] || sortOptions.rating

    const writeups = await Writeup.find(filter)
      .populate('user', 'username fullName')
      .populate('challenge', 'title category difficulty')
      .select('title content rating views tags createdAt')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Writeup.countDocuments(filter)

    res.json({
      writeups,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Search writeups error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get popular writeups
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const writeups = await Writeup.find({ isPublic: true })
      .populate('user', 'username fullName')
      .populate('challenge', 'title category difficulty')
      .select('title rating views tags createdAt')
      .sort({ rating: -1, views: -1 })
      .limit(parseInt(limit))

    res.json({ writeups })
  } catch (error) {
    console.error('Get popular writeups error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ===== CHALLENGE-SPECIFIC ROUTES =====

// Get writeups for a challenge
router.get('/challenge/:challengeId', async (req, res) => {
  try {
    const { challengeId } = req.params
    const { page = 1, limit = 20, sort = 'rating' } = req.query

    // Check if challenge exists
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    const sortOptions = {
      rating: { rating: -1, createdAt: -1 },
      recent: { createdAt: -1 },
      views: { views: -1 }
    }

    const writeups = await Writeup.find({
      challenge: challengeId,
      isPublic: true
    })
      .populate('user', 'username fullName')
      .select('title content rating views votes tags createdAt')
      .sort(sortOptions[sort] || sortOptions.rating)
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Writeup.countDocuments({
      challenge: challengeId,
      isPublic: true
    })

    // Calculate vote counts for each writeup
    const writeupsWithVotes = writeups.map(writeup => {
      const upvotes = writeup.votes.filter(v => v.type === 'up').length
      const downvotes = writeup.votes.filter(v => v.type === 'down').length
      
      return {
        ...writeup.toObject(),
        upvotes,
        downvotes,
        userVote: null // Will be set if user is authenticated
      }
    })

    res.json({
      writeups: writeupsWithVotes,
      challenge: {
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get writeups error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ===== USER-SPECIFIC ROUTES =====

// Get current user's writeups
router.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, publicOnly = 'true' } = req.query

    const filter = { user: req.userId }
    if (publicOnly === 'true') {
      filter.isPublic = true
    }

    const writeups = await Writeup.find(filter)
      .populate('challenge', 'title category difficulty points')
      .select('title rating views tags isPublic createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Writeup.countDocuments(filter)

    res.json({
      writeups,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get user writeups error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's writeups
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20, publicOnly = 'true' } = req.query

    // Validate userId is a valid ObjectId
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const filter = { user: userId }
    if (publicOnly === 'true') {
      filter.isPublic = true
    }

    const writeups = await Writeup.find(filter)
      .populate('challenge', 'title category difficulty points')
      .select('title rating views tags isPublic createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Writeup.countDocuments(filter)

    res.json({
      writeups,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get user writeups error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ===== INDIVIDUAL WRITEUP ROUTES =====

// Get single writeup
router.get('/:writeupId', async (req, res) => {
  try {
    const writeup = await Writeup.findById(req.params.writeupId)
      .populate('user', 'username fullName')
      .populate('challenge', 'title category difficulty points')

    if (!writeup) {
      return res.status(404).json({ error: 'Writeup not found' })
    }

    // Increment view count
    writeup.views += 1
    await writeup.save()

    const upvotes = writeup.votes.filter(v => v.type === 'up').length
    const downvotes = writeup.votes.filter(v => v.type === 'down').length

    // Check if user has voted (if authenticated)
    let userVote = null
    if (req.userId) {
      const userVoteObj = writeup.votes.find(v => v.user.toString() === req.userId)
      userVote = userVoteObj ? userVoteObj.type : null
    }

    res.json({
      writeup: {
        id: writeup._id,
        title: writeup.title,
        content: writeup.content,
        user: writeup.user,
        challenge: writeup.challenge,
        rating: writeup.rating,
        views: writeup.views,
        upvotes,
        downvotes,
        userVote,
        tags: writeup.tags,
        isPublic: writeup.isPublic,
        createdAt: writeup.createdAt,
        updatedAt: writeup.updatedAt
      }
    })
  } catch (error) {
    console.error('Get writeup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create writeup
router.post('/', [
  authMiddleware,
  body('challengeId').isMongoId(),
  body('title').notEmpty().trim().isLength({ max: 100 }),
  body('content').notEmpty().trim().isLength({ min: 100 }),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { challengeId, title, content, tags = [], isPublic = false } = req.body
    const userId = req.userId

    // Check if challenge exists
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    // Check if user has solved the challenge
    const Submission = await import('../models/Submission.js')
    const hasSolved = await Submission.default.exists({
      user: userId,
      challenge: challengeId,
      isCorrect: true
    })

    if (!hasSolved) {
      return res.status(403).json({ error: 'You must solve the challenge before writing a writeup' })
    }

    // Check if user already has a writeup for this challenge
    const existingWriteup = await Writeup.findOne({
      user: userId,
      challenge: challengeId
    })

    if (existingWriteup) {
      return res.status(400).json({ error: 'You already have a writeup for this challenge' })
    }

    // Create writeup
    const writeup = new Writeup({
      challenge: challengeId,
      user: userId,
      title,
      content,
      tags,
      isPublic
    })

    await writeup.save()

    // Populate for response
    await writeup.populate('user', 'username fullName')
    await writeup.populate('challenge', 'title category')

    res.status(201).json({
      message: 'Writeup created successfully',
      writeup: {
        id: writeup._id,
        title: writeup.title,
        content: writeup.content,
        user: writeup.user,
        challenge: writeup.challenge,
        tags: writeup.tags,
        isPublic: writeup.isPublic,
        createdAt: writeup.createdAt
      }
    })
  } catch (error) {
    console.error('Create writeup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update writeup
router.put('/:writeupId', [
  authMiddleware,
  body('title').optional().trim().isLength({ max: 100 }),
  body('content').optional().trim().isLength({ min: 100 }),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const writeup = await Writeup.findById(req.params.writeupId)
    if (!writeup) {
      return res.status(404).json({ error: 'Writeup not found' })
    }

    // Check if user owns the writeup
    if (writeup.user.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own writeups' })
    }

    const { title, content, tags, isPublic } = req.body
    const updates = {}

    if (title !== undefined) updates.title = title  // Fixed: Added 'undefined' after '!=='
    if (content !== undefined) updates.content = content
    if (tags !== undefined) updates.tags = tags
    if (isPublic !== undefined) updates.isPublic = isPublic

    const updatedWriteup = await Writeup.findByIdAndUpdate(
      req.params.writeupId,
      { $set: updates },
      { new: true }
    ).populate('user', 'username fullName')
     .populate('challenge', 'title category')

    res.json({
      message: 'Writeup updated successfully',
      writeup: updatedWriteup
    })
  } catch (error) {
    console.error('Update writeup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete writeup
router.delete('/:writeupId', authMiddleware, async (req, res) => {
  try {
    const writeup = await Writeup.findById(req.params.writeupId)
    if (!writeup) {
      return res.status(404).json({ error: 'Writeup not found' })
    }

    // Check if user owns the writeup
    if (writeup.user.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own writeups' })
    }

    await Writeup.findByIdAndDelete(req.params.writeupId)

    res.json({ message: 'Writeup deleted successfully' })
  } catch (error) {
    console.error('Delete writeup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Vote on writeup
router.post('/:writeupId/vote', [
  authMiddleware,
  body('type').isIn(['up', 'down'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { type } = req.body
    const writeup = await Writeup.findById(req.params.writeupId)

    if (!writeup) {
      return res.status(404).json({ error: 'Writeup not found' })
    }

    // Check if user owns the writeup
    if (writeup.user.toString() === req.userId) {
      return res.status(400).json({ error: 'You cannot vote on your own writeup' })
    }

    // Remove existing vote
    writeup.votes = writeup.votes.filter(vote => vote.user.toString() !== req.userId)

    // Add new vote
    writeup.votes.push({
      user: req.userId,
      type: type
    })

    // Recalculate rating
    const upvotes = writeup.votes.filter(v => v.type === 'up').length
    const downvotes = writeup.votes.filter(v => v.type === 'down').length
    writeup.rating = upvotes - downvotes

    await writeup.save()

    res.json({
      message: 'Vote recorded successfully',
      rating: writeup.rating,
      upvotes,
      downvotes,
      userVote: type
    })
  } catch (error) {
    console.error('Vote error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove vote
router.delete('/:writeupId/vote', authMiddleware, async (req, res) => {
  try {
    const writeup = await Writeup.findById(req.params.writeupId)

    if (!writeup) {
      return res.status(404).json({ error: 'Writeup not found' })
    }

    // Remove user's vote
    const initialLength = writeup.votes.length
    writeup.votes = writeup.votes.filter(vote => vote.user.toString() !== req.userId)

    if (writeup.votes.length === initialLength) {
      return res.status(400).json({ error: 'No vote to remove' })
    }

    // Recalculate rating
    const upvotes = writeup.votes.filter(v => v.type === 'up').length
    const downvotes = writeup.votes.filter(v => v.type === 'down').length
    writeup.rating = upvotes - downvotes

    await writeup.save()

    res.json({
      message: 'Vote removed successfully',
      rating: writeup.rating,
      upvotes,
      downvotes,
      userVote: null
    })
  } catch (error) {
    console.error('Remove vote error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

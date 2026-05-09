import express from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()

// ✅ SIMPLIFIED: Remove complex rate limiting temporarily
const simpleRateLimit = (req, res, next) => {
  next()
}

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' })
}

// Login route - SIMPLIFIED
router.post('/login', [
  simpleRateLimit,
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' })
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        score: user.score
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Register route - SIMPLIFIED
router.post('/register', [
  simpleRateLimit,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3, max: 30 }),
  body('fullName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password, username, fullName } = req.body

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      })
    }

    // Create user
    const user = new User({
      email,
      password,
      username,
      fullName,
      role: 'participant'
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        score: user.score
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Profile route
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        score: user.score
      }
    })

  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
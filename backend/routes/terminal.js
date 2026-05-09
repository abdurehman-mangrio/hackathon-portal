import express from 'express'
import { body, validationResult } from 'express-validator'
import Challenge from '../models/Challenge.js'
import User from '../models/User.js'
import { executeCommand } from '../utils/commandExecutor.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Terminal command execution
router.post('/command', [
  authMiddleware,
  body('command').notEmpty().trim(),
  body('challengeId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { command, challengeId } = req.body
    const userId = req.userId

    // Get challenge details
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    // Get user details
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Execute command
    const result = await executeCommand(command, challenge, user)

    res.json({
      success: true,
      output: result.output,
      files: result.files,
      solved: result.solved || false,
      points: result.points || 0
    })

  } catch (error) {
    console.error('Terminal command error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
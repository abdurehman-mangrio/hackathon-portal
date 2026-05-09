import mongoose from 'mongoose'

const userChallengeProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttempt: Date,
  hintsUsed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hint'
  }],
  timeSpent: {
    type: Number,
    default: 0
  }, // in seconds
  startedAt: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
}, {
  timestamps: true
})

// Unique progress per user per challenge
userChallengeProgressSchema.index({ user: 1, challenge: 1 }, { unique: true })
userChallengeProgressSchema.index({ completed: 1 })

export default mongoose.model('UserChallengeProgress', userChallengeProgressSchema)
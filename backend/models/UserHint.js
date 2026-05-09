import mongoose from 'mongoose'

const userHintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hint',
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  },
  pointsDeducted: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
})

// Prevent duplicate hint usage
userHintSchema.index({ user: 1, hint: 1 }, { unique: true })
userHintSchema.index({ usedAt: -1 })

export default mongoose.model('UserHint', userHintSchema)
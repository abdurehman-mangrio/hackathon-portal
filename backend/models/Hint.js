import mongoose from 'mongoose'

const hintSchema = new mongoose.Schema({
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  content: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  cooldown: {
    type: Number,
    default: 300 // 5 minutes in seconds
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Prevent duplicate hint levels per challenge
hintSchema.index({ challenge: 1, level: 1 }, { unique: true })

export default mongoose.model('Hint', hintSchema)
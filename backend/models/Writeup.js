import mongoose from 'mongoose'

const writeupSchema = new mongoose.Schema({
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['up', 'down']
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  tags: [String]
}, {
  timestamps: true
})

// Index for popular writeups
writeupSchema.index({ challenge: 1, rating: -1 })
writeupSchema.index({ isPublic: 1, createdAt: -1 })
writeupSchema.index({ tags: 1 })

export default mongoose.model('Writeup', writeupSchema)
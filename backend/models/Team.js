import mongoose from 'mongoose'

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  solvedChallenges: [{
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge'
    },
    solvedAt: {
      type: Date,
      default: Date.now
    },
    solvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  avatar: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Prevent duplicate members
teamSchema.index({ name: 1 }, { unique: true })
teamSchema.index({ members: 1 })
teamSchema.index({ score: -1 })

export default mongoose.model('Team', teamSchema)
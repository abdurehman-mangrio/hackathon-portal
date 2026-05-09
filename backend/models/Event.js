import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  challenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  maxTeamSize: {
    type: Number,
    default: 4
  },
  rules: mongoose.Schema.Types.Mixed,
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  banner: String,
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for active events query
eventSchema.index({ startTime: 1, endTime: 1 })
eventSchema.index({ isActive: 1 })

export default mongoose.model('Event', eventSchema)
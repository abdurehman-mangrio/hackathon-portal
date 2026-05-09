import mongoose from 'mongoose'

const achievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'first_blood',
      'solver',
      'category_master',
      'speed_demon',
      'persistence',
      'streak',
      'point_milestone',
      'team_player'
    ]
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  category: String,
  points: Number,
  metadata: mongoose.Schema.Types.Mixed,
  awardedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Index for faster queries
achievementSchema.index({ user: 1, type: 1 })
achievementSchema.index({ awardedAt: -1 })

export default mongoose.model('Achievement', achievementSchema)
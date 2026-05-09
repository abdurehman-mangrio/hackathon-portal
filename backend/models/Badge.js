import mongoose from 'mongoose'

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#6B7280'
  },
  criteria: {
    type: {
      type: String,
      required: true,
      enum: [
        'score_threshold',
        'challenges_solved',
        'category_mastery',
        'streak',
        'first_blood',
        'team_work'
      ]
    },
    threshold: Number,
    category: String,
    days: Number
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

export default mongoose.model('Badge', badgeSchema)
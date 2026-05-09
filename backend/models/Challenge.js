import mongoose from 'mongoose'

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['web', 'crypto', 'forensics', 'pwn', 'misc', 'reverse']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  flag: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // New fields for enhanced features
  dynamicScoring: {
    type: Boolean,
    default: false
  },
  basePoints: {
    type: Number,
    default: function() { return this.points }
  },
  minPoints: {
    type: Number,
    default: function() { return Math.floor(this.points * 0.3) }
  },
  solveCount: {
    type: Number,
    default: 0
  },
  decay: {
    type: Number,
    default: 0.95
  },
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    size: Number
  }],
  dockerImage: String,
  port: Number,
  healthCheck: {
    type: String,
    default: ''
  },
  validationType: {
    type: String,
    enum: ['static', 'dynamic', 'manual'],
    default: 'static'
  },
  flagFormat: {
    type: String,
    default: 'CTF\\{.*\\}'
  },
  maxAttempts: {
    type: Number,
    default: 0 // 0 = unlimited
  },
  timeLimit: {
    type: Number,
    default: 0 // in minutes, 0 = no limit
  },
  requiresAttachment: {
    type: Boolean,
    default: false
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
})

// Virtual for dynamic points calculation
challengeSchema.virtual('currentPoints').get(function() {
  if (!this.dynamicScoring) return this.points
  
  return Math.max(
    this.minPoints,
    Math.floor(this.basePoints * Math.pow(this.decay, this.solveCount))
  )
})

// Indexes for better query performance
challengeSchema.index({ category: 1, difficulty: 1 })
challengeSchema.index({ isActive: 1 })
challengeSchema.index({ createdBy: 1 })
challengeSchema.index({ tags: 1 })
challengeSchema.index({ points: -1 })
challengeSchema.index({ solveCount: -1 })

// Update points when solve count changes
challengeSchema.pre('save', function(next) {
  if (this.dynamicScoring && this.isModified('solveCount')) {
    this.points = this.currentPoints
  }
  next()
})

export default mongoose.model('Challenge', challengeSchema)
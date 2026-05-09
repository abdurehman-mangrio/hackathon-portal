import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // creates index automatically
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true, // creates index automatically
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['participant', 'admin'],
    default: 'participant'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  solvedChallenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  score: {
    type: Number,
    default: 0
  },
  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    showHints: { type: Boolean, default: true },
    theme: { type: String, default: 'dark' }
  },
  statistics: {
    totalAttempts: { type: Number, default: 0 },
    correctSubmissions: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    favoriteCategory: String
  },
  lastSolve: Date,
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastSolveDate: Date
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Update streak method
userSchema.methods.updateStreak = function () {
  const today = new Date().toDateString()
  const lastSolve = this.streak.lastSolveDate?.toDateString()

  if (lastSolve === today) return

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (lastSolve === yesterday.toDateString()) {
    this.streak.current += 1
  } else {
    this.streak.current = 1
  }

  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current
  }

  this.streak.lastSolveDate = new Date()
  this.lastSolve = new Date()
}

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  return user
}

// ✅ Keep only the performance indexes (no duplicates)
userSchema.index({ score: -1 })
userSchema.index({ 'statistics.correctSubmissions': -1 })
userSchema.index({ lastSolve: -1 })

export default mongoose.model('User', userSchema)

import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema({
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
  flagSubmitted: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  ip: String,
  userAgent: String,
  // New fields
  pointsAwarded: {
    type: Number,
    default: 0
  },
  solveOrder: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number,
    default: 0
  }, // in seconds
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  metadata: {
    dockerContainerId: String,
    filesSubmitted: [String],
    validationLog: String
  }
}, {
  timestamps: true
})

// Prevent duplicate correct submissions
submissionSchema.index({ user: 1, challenge: 1, isCorrect: 1 }, { 
  unique: true,
  partialFilterExpression: { isCorrect: true }
})

// Indexes for better performance
submissionSchema.index({ user: 1, createdAt: -1 })
submissionSchema.index({ challenge: 1, isCorrect: 1 })
submissionSchema.index({ createdAt: -1 })
submissionSchema.index({ solveOrder: 1 })
submissionSchema.index({ team: 1 })

// Update solve order for first blood tracking
submissionSchema.pre('save', async function(next) {
  if (this.isCorrect && !this.solveOrder) {
    const solveCount = await mongoose.model('Submission').countDocuments({
      challenge: this.challenge,
      isCorrect: true
    })
    this.solveOrder = solveCount + 1
  }
  next()
})

export default mongoose.model('Submission', submissionSchema)

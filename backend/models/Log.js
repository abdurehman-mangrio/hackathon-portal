import mongoose from 'mongoose'

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['error', 'warn', 'info', 'debug'],
    index: true
  },
  service: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  user: {
    type: String,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    ip: String,
    userAgent: String,
    requestId: String,
    method: String,
    url: String,
    statusCode: Number,
    responseTime: Number,
    stackTrace: String,
    userId: String
  }
}, {
  timestamps: true
})

// Compound indexes for better query performance
logSchema.index({ service: 1, level: 1 })
logSchema.index({ timestamp: -1 })
logSchema.index({ level: 1, timestamp: -1 })

// Static method to get unique services
logSchema.statics.getServices = function() {
  return this.distinct('service')
}

// Static method for log rotation (delete old logs)
logSchema.statics.rotateLogs = async function(daysToKeep = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  })
  
  return result
}

export default mongoose.model('Log', logSchema)
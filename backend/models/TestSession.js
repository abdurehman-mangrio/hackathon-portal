import mongoose from 'mongoose'

const testSessionSchema = new mongoose.Schema({
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
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated', 'disqualified'],
    default: 'active'
  },
  // Security monitoring
  security: {
    webcamEnabled: { type: Boolean, default: false },
    screenRecording: { type: Boolean, default: false },
    tabFocus: { type: Boolean, default: true },
    clipboardDisabled: { type: Boolean, default: true },
    devToolsDisabled: { type: Boolean, default: true }
  },
  // Monitoring data
  monitoring: {
    webcamAlerts: [{
      timestamp: Date,
      type: String, // 'multiple_faces', 'no_face', 'face_away', 'suspicious_activity'
      confidence: Number,
      screenshot: String // Base64 encoded
    }],
    focusEvents: [{
      timestamp: Date,
      type: String, // 'blur', 'focus'
      duration: Number
    }],
    tabSwitches: [{
      timestamp: Date,
      count: Number,
      urls: [String]
    }],
    clipboardEvents: [{
      timestamp: Date,
      action: String // 'copy', 'paste', 'cut'
    }],
    consoleEvents: [{
      timestamp: Date,
      command: String
    }]
  },
  // Violation tracking
  violations: [{
    timestamp: Date,
    type: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    description: String,
    action: { type: String, enum: ['warning', 'terminated', 'disqualified'] }
  }],
  // Session controls
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number, // in seconds
  autoTerminateAt: Date,
  // Screenshot evidence
  screenshots: [{
    timestamp: Date,
    image: String, // Base64 encoded
    alertType: String,
    confidence: Number
  }],
  // System info
  userAgent: String,
  ipAddress: String,
  screenResolution: String,
  browserInfo: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
})

// Index for active sessions
testSessionSchema.index({ user: 1, status: 1 })
testSessionSchema.index({ sessionId: 1 })
testSessionSchema.index({ autoTerminateAt: 1 }, { expireAfterSeconds: 0 })

// Methods
testSessionSchema.methods.addViolation = function(type, severity, description, action = 'warning') {
  this.violations.push({
    timestamp: new Date(),
    type,
    severity,
    description,
    action
  })
  
  if (action === 'terminated' || action === 'disqualified') {
    this.status = action
    this.endTime = new Date()
  }
  
  return this.save()
}

testSessionSchema.methods.addWebcamAlert = function(alertType, confidence, screenshot = null) {
  this.monitoring.webcamAlerts.push({
    timestamp: new Date(),
    type: alertType,
    confidence,
    screenshot
  })
  
  return this.save()
}

testSessionSchema.methods.terminateSession = function(reason = 'Security violation') {
  this.status = 'terminated'
  this.endTime = new Date()
  this.violations.push({
    timestamp: new Date(),
    type: 'manual_termination',
    severity: 'high',
    description: reason,
    action: 'terminated'
  })
  
  return this.save()
}

export default mongoose.model('TestSession', testSessionSchema)
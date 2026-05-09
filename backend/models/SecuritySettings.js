import mongoose from 'mongoose'

const securitySettingsSchema = new mongoose.Schema({
  // Webcam monitoring settings
  webcamMonitoring: {
    enabled: { type: Boolean, default: true },
    required: { type: Boolean, default: true },
    quality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    frameRate: { type: Number, default: 1 }, // frames per second
    detection: {
      faceDetection: { type: Boolean, default: true },
      multipleFaces: { type: Boolean, default: true },
      faceAwayDetection: { type: Boolean, default: true },
      noFaceTimeout: { type: Number, default: 10 }, // seconds
      confidenceThreshold: { type: Number, default: 0.7 }
    }
  },
  // Browser restrictions
  browserRestrictions: {
    disableDevTools: { type: Boolean, default: true },
    disableClipboard: { type: Boolean, default: true },
    disableRightClick: { type: Boolean, default: true },
    disablePrintScreen: { type: Boolean, default: true },
    restrictTabSwitching: { type: Boolean, default: true },
    maxTabSwitches: { type: Number, default: 3 },
    fullScreenRequired: { type: Boolean, default: true }
  },
  // Monitoring frequency
  monitoring: {
    screenshotInterval: { type: Number, default: 30 }, // seconds
    focusCheckInterval: { type: Number, default: 5 }, // seconds
    webcamCheckInterval: { type: Number, default: 10 } // seconds
  },
  // Violation thresholds
  violationThresholds: {
    maxWebcamAlerts: { type: Number, default: 5 },
    maxTabSwitches: { type: Number, default: 5 },
    maxFocusLoss: { type: Number, default: 60 }, // seconds
    autoTerminate: { type: Boolean, default: true }
  },
  // Actions on violation
  violationActions: {
    webcamViolation: { type: String, enum: ['warning', 'terminate', 'disqualify'], default: 'terminate' },
    tabSwitchViolation: { type: String, enum: ['warning', 'terminate', 'disqualify'], default: 'terminate' },
    focusViolation: { type: String, enum: ['warning', 'terminate', 'disqualify'], default: 'warning' },
    devToolsViolation: { type: String, enum: ['warning', 'terminate', 'disqualify'], default: 'terminate' }
  },
  // Session settings
  sessionSettings: {
    maxDuration: { type: Number, default: 3600 }, // seconds
    autoStart: { type: Boolean, default: true },
    requireVerification: { type: Boolean, default: true }
  }
}, {
  timestamps: true
})

export default mongoose.model('SecuritySettings', securitySettingsSchema)
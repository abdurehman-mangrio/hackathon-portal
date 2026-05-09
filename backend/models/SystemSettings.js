import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    default: 'CTF Platform',
    required: true
  },
  siteDescription: {
    type: String,
    default: 'Capture The Flag Platform'
  },
  adminEmail: {
    type: String,
    default: 'admin@ctfplatform.com',
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'en'
  },
  
  // Security Settings
  maxLoginAttempts: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  sessionTimeout: {
    type: Number,
    default: 60, // minutes
    min: 5,
    max: 1440
  },
  requireEmailVerification: {
    type: Boolean,
    default: true
  },
  allowRegistrations: {
    type: Boolean,
    default: true
  },
  minPasswordLength: {
    type: Number,
    default: 8,
    min: 6,
    max: 32
  },
  
  // CTF Settings
  ctfMode: {
    type: String,
    enum: ['practice', 'competition', 'maintenance'],
    default: 'practice'
  },
  teamSizeLimit: {
    type: Number,
    default: 4,
    min: 1,
    max: 10
  },
  scoringType: {
    type: String,
    enum: ['static', 'dynamic'],
    default: 'dynamic'
  },
  challengePointsBase: {
    type: Number,
    default: 100,
    min: 50,
    max: 1000
  },
  showLeaderboard: {
    type: Boolean,
    default: true
  },
  allowTeamCreation: {
    type: Boolean,
    default: true
  },
  
  // Email Settings
  email: {
    smtpHost: {
      type: String,
      default: ''
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpUsername: {
      type: String,
      default: ''
    },
    smtpPassword: {
      type: String,
      default: ''
    },
    emailFrom: {
      type: String,
      default: 'noreply@ctfplatform.com'
    },
    emailEnabled: {
      type: Boolean,
      default: false
    }
  },
  
  // Maintenance Settings
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'Platform is under maintenance. Please check back later.'
  },
  
  // Theme Settings
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  primaryColor: {
    type: String,
    default: '#3B82F6'
  },
  enableAnimations: {
    type: Boolean,
    default: true
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Static method to get current settings
systemSettingsSchema.statics.getCurrent = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

// Method to check if platform is in maintenance
systemSettingsSchema.methods.isMaintenanceMode = function() {
  return this.maintenanceMode;
};

// Method to validate email settings
systemSettingsSchema.methods.hasValidEmailConfig = function() {
  return this.email.smtpHost && 
         this.email.smtpPort && 
         this.email.smtpUsername && 
         this.email.smtpPassword &&
         this.email.emailFrom;
};

export default mongoose.model('SystemSettings', systemSettingsSchema);
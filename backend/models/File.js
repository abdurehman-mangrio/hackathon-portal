import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Index for challenge files
fileSchema.index({ challenge: 1, createdAt: -1 })
fileSchema.index({ uploadedBy: 1 })

export default mongoose.model('File', fileSchema)
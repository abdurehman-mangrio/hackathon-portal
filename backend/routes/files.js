import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import File from '../models/File.js'
import Challenge from '../models/Challenge.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const challengeId = req.params.challengeId
    const uploadDir = path.join(__dirname, '../../uploads/challenges', challengeId)
    
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error, null)
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const originalName = file.originalname
    const filename = `${timestamp}-${originalName}`
    cb(null, filename)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/x-pdf', // Alternative PDF mimetype
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'text/x-python',
    'application/x-python-code',
    'text/x-c',
    'text/x-c++',
    'application/javascript',
    'text/html',
    'text/css',
    'application/json',
    'application/java-archive', // .jar files
    'application/x-msdownload', // .exe files
    'application/octet-stream', // binary files
    'application/x-executable', // executables
    'text/x-shellscript', // shell scripts
    'application/x-perl', // perl scripts
    'application/x-ruby', // ruby scripts
    'text/x-php', // php files
    'application/xml', // xml files
    'text/xml' // xml files
  ]

  // Allow files based on extension as fallback
  const allowedExtensions = [
    '.pdf', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar',
    '.py', '.c', '.cpp', '.js', '.html', '.css', '.json', '.jar',
    '.exe', '.bin', '.sh', '.pl', '.rb', '.php', '.xml'
  ]

  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))

  console.log(`File upload attempt: ${file.originalname}, mimetype: ${file.mimetype}, extension: ${fileExtension}`)

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true)
  } else {
    console.log(`File type not allowed: ${file.mimetype} for file ${file.originalname}`)
    cb(new Error(`File type not allowed: ${file.mimetype}`), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Max 5 files per upload
  }
})

// Upload files for a challenge (admin only)
// Upload files for a challenge (admin only)
router.post('/challenge/:challengeId/upload', [
  authMiddleware,
  adminMiddleware,
  upload.array('files', 5)
], async (req, res) => {
  try {
    console.log('📤 File upload request received:', {
      challengeId: req.params.challengeId,
      filesCount: req.files?.length,
      userId: req.userId
    })

    const { challengeId } = req.params
    const files = req.files

    if (!files || files.length === 0) {
      console.log('❌ No files in request')
      return res.status(400).json({ error: 'No files uploaded' })
    }

    // Check if challenge exists
    let challenge
    try {
      challenge = await Challenge.findById(challengeId)
    } catch (error) {
      if (error.name === 'CastError') {
        console.log('❌ Invalid challenge ID format:', challengeId)
        // Clean up uploaded files
        await Promise.all(files.map(file => fs.unlink(file.path)))
        return res.status(400).json({ error: 'Invalid challenge ID format' })
      }
      throw error
    }

    if (!challenge) {
      console.log('❌ Challenge not found:', challengeId)
      // Clean up uploaded files
      await Promise.all(files.map(file => fs.unlink(file.path)))
      return res.status(404).json({ error: 'Challenge not found' })
    }

    console.log('✅ Challenge found:', challenge.title)

    const savedFiles = []

    for (const file of files) {
      console.log('📄 Processing file:', file.originalname)
      
      // Create file record
      const fileRecord = new File({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        challenge: challengeId,
        uploadedBy: req.userId
      })

      await fileRecord.save()
      savedFiles.push(fileRecord)
      console.log('✅ File saved to database:', fileRecord._id)

      // Update challenge attachments
      if (!challenge.attachments) {
        challenge.attachments = []
      }
      
      challenge.attachments.push({
        name: file.originalname,
        url: `/api/files/download/${challengeId}/${fileRecord.filename}`,
        size: file.size
      })
    }

    await challenge.save()
    console.log('✅ Challenge updated with attachments')

    res.status(201).json({
      message: 'Files uploaded successfully',
      files: savedFiles.map(file => ({
        id: file._id,
        originalName: file.originalName,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: file.createdAt
      }))
    })

  } catch (error) {
    console.error('❌ File upload error:', error)
    console.error('Error stack:', error.stack)
    
    // Clean up any uploaded files on error
    if (req.files) {
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})))
    }
    
    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message 
    })
  }
})

// Download file
router.get('/download/:challengeId/:filename', async (req, res) => {
  try {
    const { challengeId, filename } = req.params

    // Find file record
    const fileRecord = await File.findOne({
      filename: filename,
      challenge: challengeId
    })

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Check if file exists on disk
    try {
      await fs.access(fileRecord.path)
    } catch {
      return res.status(404).json({ error: 'File not found on server' })
    }

    // Increment download count
    fileRecord.downloadCount += 1
    await fileRecord.save()

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`)
    res.setHeader('Content-Type', fileRecord.mimetype)
    res.setHeader('Content-Length', fileRecord.size)

    res.sendFile(path.resolve(fileRecord.path))

  } catch (error) {
    console.error('File download error:', error)
    res.status(500).json({ error: 'File download failed' })
  }
})

// Get files for a challenge
router.get('/challenge/:challengeId', async (req, res) => {
  try {
    const { challengeId } = req.params
    const { publicOnly = 'true' } = req.query

    const filter = { challenge: challengeId }
    if (publicOnly === 'true') {
      filter.isPublic = true
    }

    const files = await File.find(filter)
      .populate('uploadedBy', 'username')
      .select('originalName filename size mimetype downloadCount uploadedBy createdAt isPublic')
      .sort({ createdAt: -1 })

    res.json({ files })
  } catch (error) {
    console.error('Get files error:', error)
    res.status(500).json({ error: 'Failed to get files' })
  }
})

// Admin: Get all files
router.get('/admin', [
  authMiddleware,
  adminMiddleware
], async (req, res) => {
  try {
    const { page = 1, limit = 50, challengeId, search } = req.query

    const filter = {}
    if (challengeId) {
      filter.challenge = challengeId
    }
    if (search) {
      filter.originalName = { $regex: search, $options: 'i' }
    }

    const files = await File.find(filter)
      .populate('challenge', 'title category')
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await File.countDocuments(filter)

    res.json({
      files,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get admin files error:', error)
    res.status(500).json({ error: 'Failed to get files' })
  }
})

// Admin: Update file visibility
router.patch('/admin/:fileId', [
  authMiddleware,
  adminMiddleware
], async (req, res) => {
  try {
    const { isPublic } = req.body
    const file = await File.findById(req.params.fileId)

    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }

    file.isPublic = isPublic === true || isPublic === 'true'
    await file.save()

    res.json({
      message: 'File updated successfully',
      file: {
        id: file._id,
        originalName: file.originalName,
        isPublic: file.isPublic
      }
    })
  } catch (error) {
    console.error('Update file error:', error)
    res.status(500).json({ error: 'Failed to update file' })
  }
})

// Admin: Delete file
router.delete('/admin/:fileId', [
  authMiddleware,
  adminMiddleware
], async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)

    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Delete physical file
    try {
      await fs.unlink(file.path)
    } catch (error) {
      console.warn('Could not delete physical file:', error.message)
    }

    // Remove from challenge attachments
    await Challenge.findByIdAndUpdate(file.challenge, {
      $pull: {
        attachments: { name: file.originalName }
      }
    })

    // Delete file record
    await File.findByIdAndDelete(req.params.fileId)

    res.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Delete file error:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

// Get file statistics
router.get('/stats', [
  authMiddleware,
  adminMiddleware
], async (req, res) => {
  try {
    const totalFiles = await File.countDocuments()
    const totalSize = await File.aggregate([
      { $group: { _id: null, total: { $sum: '$size' } } }
    ])
    const totalDownloads = await File.aggregate([
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ])

    const typeBreakdown = await File.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $in: ['$mimetype', ['image/jpeg', 'image/png', 'image/gif']] }, then: 'images' },
                { case: { $in: ['$mimetype', ['text/plain', 'application/pdf']] }, then: 'documents' },
                { case: { $in: ['$mimetype', ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed']] }, then: 'archives' },
                { case: { $in: ['$mimetype', ['text/x-python', 'application/x-python-code', 'text/x-c', 'text/x-c++', 'application/javascript', 'text/html', 'text/css', 'application/json']] }, then: 'code' }
              ],
              default: 'other'
            }
          },
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      }
    ])

    const stats = {
      totalFiles,
      totalSize: totalSize[0]?.total || 0,
      totalDownloads: totalDownloads[0]?.total || 0,
      averageSize: totalFiles > 0 ? Math.round(totalSize[0]?.total / totalFiles) : 0,
      typeBreakdown: {
        images: { count: 0, size: 0 },
        documents: { count: 0, size: 0 },
        archives: { count: 0, size: 0 },
        code: { count: 0, size: 0 },
        other: { count: 0, size: 0 }
      }
    }

    typeBreakdown.forEach(item => {
      if (stats.typeBreakdown[item._id]) {
        stats.typeBreakdown[item._id] = {
          count: item.count,
          size: item.size
        }
      }
    })

    res.json({ stats })
  } catch (error) {
    console.error('Get file stats error:', error)
    res.status(500).json({ error: 'Failed to get file statistics' })
  }
})

// Clean up orphaned files (admin utility)
router.post('/admin/cleanup', [
  authMiddleware,
  adminMiddleware
], async (req, res) => {
  try {
    const allFiles = await File.find({})
    let cleanedCount = 0

    for (const file of allFiles) {
      try {
        await fs.access(file.path)
      } catch {
        // File doesn't exist on disk, remove record
        await File.findByIdAndDelete(file._id)
        cleanedCount++
      }
    }

    res.json({
      message: 'Cleanup completed',
      cleanedCount,
      remainingFiles: allFiles.length - cleanedCount
    })
  } catch (error) {
    console.error('File cleanup error:', error)
    res.status(500).json({ error: 'Cleanup failed' })
  }
})

export default router
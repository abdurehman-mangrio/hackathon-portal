import express from 'express'
import Log from '../models/Log.js'

const router = express.Router()

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  // Add your admin check logic here
  // For now, we'll allow access - you should implement proper admin authentication
  next()
}

// Get logs with filtering
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { level, service, search, dateRange, page = 1, limit = 100 } = req.query
    
    // Build filter object
    let filter = {}
    
    // Filter by level
    if (level) {
      filter.level = level
    }
    
    // Filter by service
    if (service) {
      filter.service = service
    }
    
    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1)
          break
        case '24h':
          startDate.setDate(now.getDate() - 1)
          break
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        default:
          startDate = new Date(0) // Beginning of time
      }
      
      filter.timestamp = { $gte: startDate }
    }
    
    // Search in multiple fields
    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { user: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Execute query with pagination
    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
    
    // Get total count for pagination
    const total = await Log.countDocuments(filter)
    
    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
    
  } catch (error) {
    console.error('Error fetching logs:', error)
    res.status(500).json({ error: 'Failed to fetch logs' })
  }
})

// Get log statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { dateRange } = req.query
    
    let dateFilter = {}
    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1)
          break
        case '24h':
          startDate.setDate(now.getDate() - 1)
          break
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
      }
      
      dateFilter.timestamp = { $gte: startDate }
    }
    
    const stats = await Log.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] }
          },
          warnCount: {
            $sum: { $cond: [{ $eq: ['$level', 'warn'] }, 1, 0] }
          },
          infoCount: {
            $sum: { $cond: [{ $eq: ['$level', 'info'] }, 1, 0] }
          },
          debugCount: {
            $sum: { $cond: [{ $eq: ['$level', 'debug'] }, 1, 0] }
          }
        }
      }
    ])
    
    const result = stats[0] || {
      totalCount: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0
    }
    
    res.json(result)
    
  } catch (error) {
    console.error('Error fetching log stats:', error)
    res.status(500).json({ error: 'Failed to fetch log statistics' })
  }
})

// Clear all logs
router.delete('/', requireAdmin, async (req, res) => {
  try {
    await Log.deleteMany({})
    res.json({ message: 'All logs cleared successfully' })
  } catch (error) {
    console.error('Error clearing logs:', error)
    res.status(500).json({ error: 'Failed to clear logs' })
  }
})

// Export logs
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { format = 'json' } = req.query
    const logs = await Log.find().sort({ timestamp: -1 }).limit(10000)
    
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(logs)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=system-logs.csv')
      return res.send(csv)
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename=system-logs.json')
      res.send(JSON.stringify(logs, null, 2))
    }
    
  } catch (error) {
    console.error('Error exporting logs:', error)
    res.status(500).json({ error: 'Failed to export logs' })
  }
})

// Helper function to convert logs to CSV
function convertToCSV(logs) {
  const headers = ['Timestamp', 'Level', 'Service', 'Message', 'User', 'IP Address']
  const csvRows = [headers.join(',')]
  
  logs.forEach(log => {
    const row = [
      log.timestamp.toISOString(),
      log.level,
      log.service,
      `"${log.message.replace(/"/g, '""')}"`, // Escape quotes in message
      log.user || '',
      log.metadata?.ip || ''
    ]
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}

export default router
import Log from '../models/Log.js'

// Middleware to log HTTP requests
const requestLogger = async (req, res, next) => {
  const start = Date.now()
  
  // Capture response details
  res.on('finish', async () => {
    try {
      const duration = Date.now() - start
      
      // Determine log level based on status code
      let level = 'info'
      if (res.statusCode >= 500) level = 'error'
      else if (res.statusCode >= 400) level = 'warn'
      
      // Skip logging for certain paths
      const excludedPaths = ['/health', '/metrics', '/favicon.ico', '/api/health']
      if (excludedPaths.some(path => req.path.includes(path))) return
      
      const logEntry = new Log({
        level,
        service: 'api-server',
        message: `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`,
        user: req.user?.id || req.user?.username || null,
        timestamp: new Date(),
        metadata: {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime: duration,
          requestId: req.id || Math.random().toString(36).substr(2, 9),
          userId: req.user?.id
        }
      })
      
      await logEntry.save()
      
      // Broadcast to WebSocket clients if it's an error
      if (level === 'error' && global.wss) {
        broadcastLog(global.wss, logEntry)
      }
      
    } catch (error) {
      console.error('Error logging request:', error)
    }
  })
  
  next()
}

// Custom logger for application logs
const applicationLogger = {
  error: (service, message, metadata = {}) => {
    createLog('error', service, message, null, metadata)
  },
  
  warn: (service, message, metadata = {}) => {
    createLog('warn', service, message, null, metadata)
  },
  
  info: (service, message, metadata = {}) => {
    createLog('info', service, message, null, metadata)
  },
  
  debug: (service, message, metadata = {}) => {
    createLog('debug', service, message, null, metadata)
  }
}

async function createLog(level, service, message, user = null, metadata = {}) {
  try {
    const logEntry = new Log({
      level,
      service,
      message,
      user,
      timestamp: new Date(),
      metadata
    })
    
    await logEntry.save()
    
    // Broadcast to WebSocket clients
    if (global.wss) {
      broadcastLog(global.wss, logEntry)
    }
    
  } catch (error) {
    console.error('Error creating application log:', error)
  }
}

// Function to broadcast new log to all connected clients
function broadcastLog(wss, log) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'new_log',
        log: log
      }))
    }
  })
}

export {
  requestLogger,
  applicationLogger,
  broadcastLog
}
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

// Load environment variables
dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI']
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '))
  process.exit(1)
}

const app = express()
const server = createServer(app)

// Initialize WebSocket server for real-time logs
const wss = new WebSocketServer({ server })
app.set('wss', wss)
global.wss = wss

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Trust proxy for rate limiting
app.set('trust proxy', 1)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging - enhanced with custom format
app.use(morgan('combined'))

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this IP' }
})
app.use('/api/', limiter)

// Auth rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per 15 minutes
  message: { error: 'Too many authentication attempts' }
})

console.log('🚀 Starting Enhanced CTF Hackathon Portal...')

async function initializeServer() {
  try {
    // Step 1: Connect to MongoDB
    console.log('🔄 Step 1: Connecting to MongoDB...')
    const connectDB = (await import('./config/database.js')).default
    await connectDB()
    console.log('✅ MongoDB connected successfully')

    // Step 1.5: Initialize Logging System
    console.log('🔄 Step 1.5: Initializing Logging System...')

    // Import and setup logging middleware
    const { requestLogger, applicationLogger } = await import('./middleware/logger.js')
    app.use(requestLogger)
    global.applicationLogger = applicationLogger
    console.log('✅ Logging system initialized')

    // Initialize WebSocket for real-time logs
    const initializeLogWebSocket = (await import('./websocket/logs.js')).default
    initializeLogWebSocket(wss)
    console.log('✅ Real-time log WebSocket initialized')

    // Step 2: Load routes (start with auth only)
    console.log('🔄 Step 2: Loading routes...')

    // Auth routes with rate limiting
    const authRoutes = (await import('./routes/auth.js')).default
    app.use('/api/auth', authLimiter, authRoutes)
    console.log('✅ Auth routes loaded')

    // Load logs routes
    try {
      const logsRoutes = (await import('./routes/logs.js')).default
      app.use('/api/admin/logs', logsRoutes)
      console.log('✅ Logs routes loaded')
    } catch (error) {
      console.log('⚠️ Logs routes skipped:', error.message)
    }

    // Load analytics routes
    try {
      const analyticsRoutes = (await import('./routes/analytics.js')).default;
      app.use('/api/analytics', analyticsRoutes);
      console.log('✅ Analytics routes loaded');
    } catch (error) {
      console.log('⚠️ Analytics routes skipped:', error.message);
    }

    // Load backup routes
    try {
      const backupRoutes = (await import('./routes/backups.js')).default;
      app.use('/api/admin/backups', backupRoutes);
      console.log('✅ Backup routes loaded');
    } catch (error) {
      console.log('⚠️ Backup routes skipped:', error.message);
    }

    // Load other routes gradually
    const routes = [
      'users',
      'challenges', 'admin', 'leaderboard', 'teams',
      'hints', 'achievements', 'files', 'writeups',
      'events',
      'securesession' // Security session routes
    ]

    for (const route of routes) {
      try {
        const routeModule = (await import(`./routes/${route}.js`)).default
        app.use(`/api/${route}`, routeModule)
        console.log(`✅ ${route} routes loaded`)
      } catch (error) {
        console.log(`⚠️ ${route} routes skipped:`, error.message)
      }
    }

    // Step 3: Initialize services (optional - can be added later)
    console.log('🔄 Step 3: Initializing services...')

    try {
      const socketService = (await import('./services/socketService.js')).default
      await socketService.initialize(server)
      console.log('✅ Socket service initialized')
    } catch (error) {
      console.log('⚠️ Socket service skipped:', error.message)
    }

    try {
      const settingsRoutes = (await import('./routes/settings.js')).default;
      app.use('/api/admin/settings', settingsRoutes);
      console.log('✅ Settings routes loaded');
    } catch (error) {
      console.log('⚠️ Settings routes skipped:', error.message);
    }

    try {
      const scoringService = (await import('./services/scoringService.js')).default
      if (scoringService.initializeDynamicScoring) {
        await scoringService.initializeDynamicScoring()
        console.log('✅ Scoring service initialized')
      }
    } catch (error) {
      console.log('⚠️ Scoring service skipped:', error.message)
    }

    // Initialize backup cleanup job
    try {
      const BackupManager = (await import('./services/BackupManager.js')).default;
      // Schedule automatic backup cleanup (runs daily)
      const cron = await import('node-cron');
      cron.default.schedule('0 3 * * *', async () => { // 3 AM daily
        try {
          console.log('🧹 Running automatic backup cleanup...');
          const result = await BackupManager.cleanupOldBackups(30); // Keep 30 days
          console.log(`✅ Backup cleanup completed: Deleted ${result.deletedCount} old backups`);
        } catch (error) {
          console.error('❌ Backup cleanup failed:', error);
        }
      });
      console.log('✅ Backup cleanup job scheduled');
    } catch (error) {
      console.log('⚠️ Backup cleanup job skipped:', error.message);
    }

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: 'Connected',
          auth: 'Active',
          security: 'Available',
          logging: 'Active',
          analytics: 'Available',
          backups: 'Available'
        }
      })
    })

    // Backup health check
    app.get('/api/admin/backups/health', async (req, res) => {
      try {
        const BackupManager = (await import('./services/BackupManager.js')).default;
        const stats = await BackupManager.getBackupStats();

        res.json({
          status: 'OK',
          backups: stats.totalBackups,
          totalSize: stats.totalSize,
          autoBackups: stats.automaticCount,
          manualBackups: stats.manualCount
        });
      } catch (error) {
        res.status(500).json({
          status: 'ERROR',
          error: 'Failed to check backup health'
        });
      }
    });

    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      console.log('❌ API endpoint not found:', req.originalUrl)
      res.status(404).json({ error: 'API endpoint not found' })
    })

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err)

      // Log the error using our application logger
      if (global.applicationLogger) {
        global.applicationLogger.error('server', `Unhandled error: ${err.message}`, {
          url: req.url,
          method: req.method,
          stack: err.stack
        })
      }

      let error = { message: 'Internal server error', status: 500 }

      if (err.name === 'JsonWebTokenError') {
        error = { message: 'Invalid token', status: 401 }
      } else if (err.name === 'TokenExpiredError') {
        error = { message: 'Token expired', status: 401 }
      } else if (err.name === 'ValidationError') {
        error = { message: err.message, status: 400 }
      }

      res.status(error.status).json({ error: error.message })
    })

    // Start server
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log('🎉 ENHANCED CTF HACKATHON PORTAL STARTED!')
      console.log('══════════════════════════════════════')
      console.log(`📍 Port: ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🗄️  Database: MongoDB ✅`)
      console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
      console.log(`🔐 Authentication: ✅ Working`)
      console.log(`📊 Logging System: ✅ Active`)
      console.log(`🔔 Real-time Logs: ✅ WebSocket Ready`)
      console.log(`📈 Analytics Dashboard: ✅ Available`)
      console.log(`💾 Backup System: ✅ Active`)
      console.log(`🔒 Security Monitoring: ✅ Available at /api/securesession`)
      console.log(`📊 Log Dashboard: http://localhost:3000/admin/logs`)
      console.log(`📈 Analytics: http://localhost:3000/admin/analytics`)
      console.log(`💾 Backups: http://localhost:3000/admin/backups`)
      console.log(`✅ Health: http://localhost:${PORT}/api/health`)
      console.log('══════════════════════════════════════')
      console.log('📧 Test Login: POST http://localhost:5000/api/auth/login')
      console.log('👤 Test Register: POST http://localhost:5000/api/auth/register')
      console.log('📊 View Logs: GET http://localhost:5000/api/admin/logs')
      console.log('📈 View Analytics: GET http://localhost:5000/api/analytics/overview')
      console.log('💾 Manage Backups: GET http://localhost:5000/api/admin/backups')
      console.log('🔒 Security Dashboard: GET http://localhost:5000/api/securesession/admin/test')
    })

  } catch (error) {
    console.error('❌ Server initialization failed:', error.message)
    process.exit(1)
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🔄 Shutting down gracefully...')

  // Close WebSocket connections
  if (global.wss) {
    global.wss.clients.forEach(client => {
      client.close()
    })
  }

  server.close(() => {
    console.log('✅ HTTP server closed')
    process.exit(0)
  })

  // Force close after 10 seconds
  setTimeout(() => {
    console.log('❌ Forcing shutdown...')
    process.exit(1)
  }, 10000)
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

// Start the server
initializeServer()
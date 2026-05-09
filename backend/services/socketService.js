import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

class SocketService {
  constructor() {
    this.io = null
    this.connectedUsers = new Map()
    this.isInitialized = false
  }

  async initialize(server) {
    if (this.isInitialized) {
      console.log('⚠️ SocketService already initialized')
      return this.io
    }

    try {
      this.io = new Server(server, {
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:3000',
          methods: ['GET', 'POST']
        }
      })

      // Optional Redis adapter (only if available)
      if (process.env.REDIS_ENABLED === 'true' && process.env.REDIS_URL) {
        try {
          const { createAdapter } = await import('@socket.io/redis-adapter')
          const Redis = (await import('ioredis')).default
          const pubClient = new Redis(process.env.REDIS_URL)
          const subClient = pubClient.duplicate()
          this.io.adapter(createAdapter(pubClient, subClient))
          console.log('✅ Socket.io Redis adapter connected')
        } catch (err) {
          console.warn('⚠️ Redis adapter failed, using memory:', err.message)
        }
      }

      this.setupMiddleware()
      this.setupEventHandlers()
      
      this.isInitialized = true
      console.log('✅ SocketService initialized successfully')
      
      return this.io
    } catch (error) {
      console.error('❌ SocketService initialization failed:', error)
      throw error
    }
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token
        if (!token) {
          return next(new Error('Authentication error: missing token'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId).select('-password')

        if (!user) {
          return next(new Error('Authentication error: user not found'))
        }

        socket.userId = user._id
        socket.user = user
        next()
      } catch (error) {
        console.error('Socket auth error:', error.message)
        next(new Error('Authentication error'))
      }
    })
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const username = socket.user?.username || 'Unknown'
      console.log(`🟢 User connected: ${username}`)

      // Save socket reference
      this.connectedUsers.set(socket.userId.toString(), socket)

      // Auto-join personal + general rooms
      socket.join(`user:${socket.userId}`)
      socket.join('leaderboard')
      socket.join('notifications')

      socket.on('join_challenge', (challengeId) => {
        socket.join(`challenge:${challengeId}`)
      })

      socket.on('leave_challenge', (challengeId) => {
        socket.leave(`challenge:${challengeId}`)
      })

      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.userId.toString())
        console.log(`🔴 User disconnected: ${username}`)
      })
    })
  }

  // === Broadcast Methods ===

  async broadcastLeaderboardUpdate() {
    if (!this.io) {
      console.warn('SocketService not initialized, skipping leaderboard update')
      return
    }

    try {
      const leaderboard = await this.getLeaderboardData()
      this.io.to('leaderboard').emit('leaderboard_update', leaderboard)
    } catch (error) {
      console.error('Leaderboard broadcast error:', error)
    }
  }

  broadcastChallengeSolve(user, challenge, isFirstBlood = false) {
    if (!this.io) {
      console.warn('SocketService not initialized, skipping challenge solve broadcast')
      return
    }

    try {
      this.io.emit('challenge_solved', {
        user: { username: user.username, id: user._id },
        challenge: {
          title: challenge.title,
          category: challenge.category,
          points: challenge.points
        },
        isFirstBlood,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Challenge solve broadcast error:', error)
    }
  }

  sendNotification(userId, notification) {
    if (!this.io) {
      console.warn('SocketService not initialized, skipping notification')
      return false
    }

    try {
      this.io.to(`user:${userId}`).emit('notification', notification)
      return true
    } catch (error) {
      console.error('Notification send error:', error)
      return false
    }
  }

  // Send welcome notification to new users
  async sendWelcomeNotification(userId) {
    if (!this.io) return false

    try {
      const user = await User.findById(userId)
      if (!user) return false

      const notification = {
        type: 'welcome',
        title: 'Welcome to CTF Platform!',
        message: 'Get started by exploring challenges and joining a team!',
        action: { label: 'View Challenges', url: '/challenges' },
        timestamp: new Date()
      }

      this.sendNotification(userId, notification)
      return true
    } catch (error) {
      console.error('Welcome notification error:', error)
      return false
    }
  }

  async getLeaderboardData() {
    try {
      const users = await User.aggregate([
        { $match: { role: 'participant', isActive: true } },
        { $sort: { score: -1, lastSolve: 1 } },
        { $limit: 50 },
        { $project: { username: 1, score: 1, solvedChallenges: 1 } }
      ])
      return users
    } catch (error) {
      console.error('Leaderboard data error:', error)
      return []
    }
  }

  // Utility method to check if service is ready
  isReady() {
    return this.isInitialized && this.io !== null
  }
}

export default new SocketService()
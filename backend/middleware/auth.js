import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' })
    }

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' })
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' })
    }

    req.userId = user._id
    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    
    res.status(401).json({ error: 'Authentication failed' })
  }
}

const adminMiddleware = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin required.' })
  }
  next()
}

export { authMiddleware, adminMiddleware }
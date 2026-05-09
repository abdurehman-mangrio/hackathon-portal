import Redis from 'ioredis'

let redis = null

// ✅ Only connect to Redis if explicitly enabled
if (process.env.REDIS_ENABLED === 'true') {
  redis = new Redis(process.env.REDIS_URL)

  redis.on('connect', () => console.log('✅ Redis connected'))
  redis.on('error', (err) =>
    console.warn('⚠️ Redis connection error (ignored in dev):', err.message)
  )
} else {
  console.log('⚠️ Redis disabled — using in-memory fallback for rate limiting')
}

// Helper for safe Redis commands or mock
const safeIncr = async (key) => {
  if (!redis) {
    // Fake increment counter
    if (!global.__fakeCounters) global.__fakeCounters = {}
    global.__fakeCounters[key] = (global.__fakeCounters[key] || 0) + 1
    return global.__fakeCounters[key]
  }
  return await redis.incr(key)
}

const safeExpire = async (key, seconds) => {
  if (!redis) return
  await redis.expire(key, seconds)
}

// === Rate limit middlewares ===
export const challengeSpecificRateLimit = (maxAttempts = 10, windowMinutes = 60) => {
  return async (req, res, next) => {
    const key = `rate_limit:${req.userId}:${req.params.challengeId}`

    try {
      const current = await safeIncr(key)
      if (current === 1) await safeExpire(key, windowMinutes * 60)

      if (current > maxAttempts) {
        return res.status(429).json({
          error: `Too many attempts. Try again in ${windowMinutes} minutes.`,
          retryAfter: windowMinutes * 60
        })
      }

      req.attemptCount = current
      next()
    } catch (error) {
      console.error('Rate limit error:', error)
      next()
    }
  }
}

export const authRateLimit = (maxAttempts = 5, windowMinutes = 15) => {
  return async (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress
    const key = `auth_rate_limit:${identifier}`

    try {
      const current = await safeIncr(key)
      if (current === 1) await safeExpire(key, windowMinutes * 60)

      if (current > maxAttempts) {
        return res.status(429).json({
          error: `Too many authentication attempts. Try again in ${windowMinutes} minutes.`
        })
      }

      next()
    } catch (error) {
      console.error('Auth rate limit error:', error)
      next()
    }
  }
}

export const globalRateLimit = (maxRequests = 1000, windowMinutes = 15) => {
  return async (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress
    const key = `global_rate_limit:${identifier}`

    try {
      const current = await safeIncr(key)
      if (current === 1) await safeExpire(key, windowMinutes * 60)

      if (current > maxRequests) {
        return res.status(429).json({
          error: 'Too many requests. Please slow down.'
        })
      }

      next()
    } catch (error) {
      console.error('Global rate limit error:', error)
      next()
    }
  }
}

import mongoose from 'mongoose'

let isConnected = false
let connectionAttempts = 0
const MAX_RETRIES = 3

const connectDB = async () => {
  // Return if already connected
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection')
    return mongoose.connection
  }

  // Check if MONGODB_URI exists
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is required in environment variables')
    console.error('💡 Please add MONGODB_URI to your .env file')
    throw new Error('MONGODB_URI is required')
  }

  // Connection options with timeouts to prevent hanging
  const options = {
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 30000, // 30 seconds
    maxPoolSize: 10,
    retryWrites: true,
  }

  try {
    connectionAttempts++
    console.log(`🔄 MongoDB connection attempt ${connectionAttempts}/${MAX_RETRIES}...`)
    
    // Set up event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully')
      isConnected = true
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected')
      isConnected = false
    })

    // Attempt connection
    const conn = await mongoose.connect(process.env.MONGODB_URI, options)
    
    isConnected = true
    connectionAttempts = 0
    
    console.log(`✅ MongoDB Connected to: ${conn.connection.host}`)
    console.log(`📊 Database: ${conn.connection.name}`)
    
    return conn

  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${connectionAttempts}/${MAX_RETRIES}):`, error.message)
    
    // Provide specific error guidance
    if (error.name === 'MongoParseError') {
      console.error('💡 Check your MONGODB_URI format in .env file')
      console.error('💡 Format should be: mongodb://username:password@host:port/database')
    } else if (error.name === 'MongoNetworkError') {
      console.error('💡 Network error - check if MongoDB is running and accessible')
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Cannot reach MongoDB server - check credentials and network')
    }
    
    // Retry logic
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`🔄 Retrying connection in 3 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 3000))
      return connectDB()
    }
    
    console.error('❌ All connection attempts failed')
    throw error
  }
}

// Helper to check connection status
export const getDBStatus = () => ({
  isConnected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection?.host,
  database: mongoose.connection?.name
})

export default connectDB
import User from '../models/User.js'
import connectDB from '../config/database.js'
import { randomBytes } from 'crypto'
import Badge from '../models/Badge.js'

const createAdminUser = async () => {
  try {
    await connectDB()
    console.log('🔄 Setting up admin user and system...')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' })
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      console.log('📋 Admin email:', existingAdmin.email)
      return
    }

    // Generate secure random password
    const tempPassword = randomBytes(12).toString('hex')
    
    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@hackathon.com',
      password: tempPassword,
      fullName: 'System Administrator',
      role: 'admin',
      score: 0
    })

    await adminUser.save()

    // Initialize default badges
    const badgeService = await import('../services/badgeService.js')
    await badgeService.default.initializeDefaultBadges()

    console.log('🎉 System setup completed successfully!')
    console.log('══════════════════════════════════════')
    console.log('📋 Admin Login Credentials:')
    console.log(`   📧 Email: admin@hackathon.com`)
    console.log(`   🔑 Password: ${tempPassword}`)
    console.log(`   👤 Username: admin`)
    console.log('══════════════════════════════════════')
    console.log('🚀 Features Enabled:')
    console.log('   ✅ Dynamic Scoring System')
    console.log('   ✅ Team Management')
    console.log('   ✅ Achievement System')
    console.log('   ✅ Badge Rewards')
    console.log('   ✅ Real-time Leaderboard')
    console.log('   ✅ Docker Challenge Support')
    console.log('   ✅ File Upload/Download')
    console.log('   ✅ Writeup System')
    console.log('══════════════════════════════════════')
    console.log('⚠️  IMPORTANT:')
    console.log('   1. Change the admin password immediately!')
    console.log('   2. Configure environment variables for production')
    console.log('   3. Set up Docker if using container challenges')
    console.log('   4. Configure Redis for rate limiting and caching')

  } catch (error) {
    console.error('❌ Error during system setup:', error.message)
    process.exit(1)
  } finally {
    process.exit()
  }
}

createAdminUser()
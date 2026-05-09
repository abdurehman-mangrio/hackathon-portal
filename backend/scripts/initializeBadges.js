import '../config/database.js'
import Badge from '../models/Badge.js'

const initializeBadges = async () => {
  try {
    console.log('🔄 Initializing default badges...')

    const defaultBadges = [
      {
        name: 'First Blood',
        description: 'Get the first solve on a challenge',
        icon: '🩸',
        color: '#DC2626',
        criteria: { type: 'first_blood' },
        rarity: 'rare'
      },
      {
        name: 'Web Warrior',
        description: 'Solve 5 web challenges',
        icon: '🌐',
        color: '#3B82F6',
        criteria: { type: 'category_mastery', category: 'web', threshold: 5 },
        rarity: 'common'
      },
      {
        name: 'Crypto Expert',
        description: 'Solve 5 cryptography challenges',
        icon: '🔐',
        color: '#10B981',
        criteria: { type: 'category_mastery', category: 'crypto', threshold: 5 },
        rarity: 'common'
      },
      {
        name: 'Forensics Master',
        description: 'Solve 5 forensics challenges',
        icon: '🔍',
        color: '#F59E0B',
        criteria: { type: 'category_mastery', category: 'forensics', threshold: 5 },
        rarity: 'common'
      },
      {
        name: 'Pwn Guru',
        description: 'Solve 5 binary exploitation challenges',
        icon: '💥',
        color: '#EF4444',
        criteria: { type: 'category_mastery', category: 'pwn', threshold: 5 },
        rarity: 'common'
      },
      {
        name: 'Reverse Engineer',
        description: 'Solve 5 reverse engineering challenges',
        icon: '⚡',
        color: '#8B5CF6',
        criteria: { type: 'category_mastery', category: 'reverse', threshold: 5 },
        rarity: 'common'
      },
      {
        name: 'Score Hunter',
        description: 'Reach 1000 points',
        icon: '🎯',
        color: '#F59E0B',
        criteria: { type: 'score_threshold', threshold: 1000 },
        rarity: 'common'
      },
      {
        name: 'CTF Legend',
        description: 'Reach 5000 points',
        icon: '🏆',
        color: '#8B5CF6',
        criteria: { type: 'score_threshold', threshold: 5000 },
        rarity: 'legendary'
      },
      {
        name: 'Team Player',
        description: 'Be part of a winning team',
        icon: '👥',
        color: '#6B7280',
        criteria: { type: 'team_work' },
        rarity: 'epic'
      },
      {
        name: 'Speed Demon',
        description: 'Solve a challenge within 5 minutes of starting',
        icon: '⚡',
        color: '#10B981',
        criteria: { type: 'speed_demon', threshold: 300 }, // 5 minutes in seconds
        rarity: 'rare'
      }
    ]

    let createdCount = 0
    for (const badgeData of defaultBadges) {
      const existing = await Badge.findOne({ name: badgeData.name })
      if (!existing) {
        await Badge.create(badgeData)
        createdCount++
        console.log(`✅ Created badge: ${badgeData.name}`)
      }
    }

    console.log(`🎉 Badge initialization complete! Created ${createdCount} new badges.`)

  } catch (error) {
    console.error('❌ Error initializing badges:', error)
  } finally {
    process.exit()
  }
}

initializeBadges()
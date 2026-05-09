import Badge from '../models/Badge.js'
import User from '../models/User.js'
import Submission from '../models/Submission.js'

class BadgeService {
  constructor() {
    // Initialize badges once (non-blocking)
    this.initializeDefaultBadges()
      .then(() => console.log('🏅 Default badges ready'))
      .catch(err => console.error('❌ Badge init failed:', err.message))
  }

  // Create default badges if not present
  async initializeDefaultBadges() {
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
      }
    ]

    for (const badgeData of defaultBadges) {
      await Badge.updateOne(
        { name: badgeData.name },
        { $setOnInsert: badgeData },
        { upsert: true }
      )
    }
  }

  // Check and award eligible badges to a user
  async checkAndAwardBadges(userId) {
    const user = await User.findById(userId).populate('solvedChallenges badges')
    const badges = await Badge.find({ isActive: true })

    if (!user) return []

    const awardedBadges = []

    for (const badge of badges) {
      const meetsCriteria = await this.meetsBadgeCriteria(user, badge)
      const alreadyHas = user.badges.some(b => b._id.equals(badge._id))

      if (meetsCriteria && !alreadyHas) {
        user.badges.push(badge._id)
        awardedBadges.push(badge)
      }
    }

    if (awardedBadges.length > 0) {
      await user.save()

      // Notify user via socket
      const { default: socketService } = await import('./socketService.js')
      for (const badge of awardedBadges) {
        socketService.sendNotification(userId, {
          type: 'badge',
          title: 'New Badge Earned!',
          message: `You earned the ${badge.name} badge!`,
          badge
        })
      }
    }

    return awardedBadges
  }

  // Badge condition logic
  async meetsBadgeCriteria(user, badge) {
    const { criteria } = badge

    switch (criteria.type) {
      case 'score_threshold':
        return user.score >= criteria.threshold

      case 'challenges_solved':
        return user.solvedChallenges.length >= criteria.threshold

      case 'category_mastery': {
        const count = user.solvedChallenges.filter(
          ch => ch.category?.toLowerCase() === criteria.category.toLowerCase()
        ).length
        return count >= criteria.threshold
      }

      case 'first_blood': {
        const { default: Achievement } = await import('../models/Achievement.js')
        return !!(await Achievement.findOne({
          user: user._id,
          type: 'first_blood'
        }))
      }

      case 'team_work': {
        const { default: Team } = await import('../models/Team.js')
        return !!(await Team.findOne({
          members: user._id,
          'eventWins.0': { $exists: true }
        }))
      }

      default:
        return false
    }
  }

  // List badges owned by a user
  async getUserBadges(userId) {
    const user = await User.findById(userId).populate('badges')
    return user?.badges || []
  }

  // Leaderboard of users with most badges
  async getBadgeLeaderboard() {
    return User.aggregate([
      { $match: { role: 'participant' } },
      {
        $project: {
          username: 1,
          badgeCount: { $size: '$badges' },
          badges: 1,
          score: 1
        }
      },
      { $sort: { badgeCount: -1, score: -1 } },
      { $limit: 20 }
    ])
  }
}

export default new BadgeService()

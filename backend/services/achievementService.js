import Achievement from '../models/Achievement.js'
import Submission from '../models/Submission.js'
import User from '../models/User.js'

export class AchievementService {
  async checkFirstBlood(challengeId, userId) {
    const solveCount = await Submission.countDocuments({ 
      challenge: challengeId, 
      isCorrect: true 
    })
    
    if (solveCount === 1) {
      await Achievement.create({
        user: userId,
        type: 'first_blood',
        challenge: challengeId,
        metadata: { solveNumber: 1 }
      })

      // Notify via socket
      const socketService = await import('./socketService.js')
      socketService.default.sendNotification(userId, {
        type: 'achievement',
        title: 'First Blood!',
        message: 'You got the first solve on this challenge!',
        achievement: 'first_blood'
      })
    }
  }

  async checkCategoryMaster(userId, category) {
    const categorySolves = await Submission.countDocuments({
      user: userId,
      isCorrect: true
    }).populate('challenge')
    
    // This is simplified - you'd need to check actual category solves
    const categoryCount = await Submission.aggregate([
      { $match: { user: userId, isCorrect: true } },
      {
        $lookup: {
          from: 'challenges',
          localField: 'challenge',
          foreignField: '_id',
          as: 'challenge'
        }
      },
      { $unwind: '$challenge' },
      { $match: { 'challenge.category': category } },
      { $count: 'count' }
    ])

    const count = categoryCount[0]?.count || 0

    if (count >= 5) {
      const existingAchievement = await Achievement.findOne({
        user: userId,
        type: 'category_master',
        category: category
      })

      if (!existingAchievement) {
        await Achievement.create({
          user: userId,
          type: 'category_master',
          category: category,
          metadata: { count: count }
        })
      }
    }
  }

  async checkPointMilestones(userId) {
    const user = await User.findById(userId)
    const milestones = [100, 500, 1000, 2500, 5000]

    for (const milestone of milestones) {
      if (user.score >= milestone) {
        const existing = await Achievement.findOne({
          user: userId,
          type: 'point_milestone',
          points: milestone
        })

        if (!existing) {
          await Achievement.create({
            user: userId,
            type: 'point_milestone',
            points: milestone,
            metadata: { milestone: milestone }
          })
        }
      }
    }
  }

  async awardAchievement(userId, achievementType, metadata = {}) {
    const achievement = new Achievement({
      user: userId,
      type: achievementType,
      metadata: metadata
    })

    await achievement.save()
    return achievement
  }

  async getUserAchievements(userId) {
    return Achievement.find({ user: userId })
      .populate('challenge', 'title category points')
      .sort({ awardedAt: -1 })
  }
}

export default new AchievementService()
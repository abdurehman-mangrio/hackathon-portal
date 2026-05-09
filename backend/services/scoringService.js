import Challenge from '../models/Challenge.js'

export class ScoringService {
  calculateDynamicPoints(challenge) {
    if (!challenge.dynamicScoring) {
      return challenge.points
    }

    const { solveCount, basePoints, minPoints, decay } = challenge
    const calculatedPoints = Math.max(
      minPoints,
      Math.floor(basePoints * Math.pow(decay, solveCount))
    )

    return calculatedPoints
  }

  async updateChallengePoints(challengeId) {
    const challenge = await Challenge.findById(challengeId)
    if (!challenge.dynamicScoring) return

    const newPoints = this.calculateDynamicPoints(challenge)
    
    if (newPoints !== challenge.points) {
      await Challenge.findByIdAndUpdate(challengeId, { 
        points: newPoints 
      })
      
      // Notify about point change
      const socketService = await import('./socketService.js')
      socketService.default.io.emit('points_updated', {
        challengeId,
        newPoints,
        oldPoints: challenge.points
      })
    }
  }

  async initializeDynamicScoring() {
    // Initialize dynamic scoring for existing challenges
    const challenges = await Challenge.find({ dynamicScoring: true })
    
    for (const challenge of challenges) {
      const solveCount = await this.getSolveCount(challenge._id)
      const newPoints = this.calculateDynamicPoints({
        ...challenge.toObject(),
        solveCount
      })
      
      if (newPoints !== challenge.points) {
        await Challenge.findByIdAndUpdate(challenge._id, { points: newPoints })
      }
    }
  }

  async getSolveCount(challengeId) {
    const Submission = await import('../models/Submission.js')
    return Submission.default.countDocuments({ 
      challenge: challengeId, 
      isCorrect: true 
    })
  }
}

export default new ScoringService()
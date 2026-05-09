import express from 'express'
import { body, validationResult } from 'express-validator'
import Team from '../models/Team.js'
import User from '../models/User.js'
import { authMiddleware } from '../middleware/auth.js'
import socketService from '../services/socketService.js'

const router = express.Router()

// Get all teams
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query

    const filter = { isActive: true }
    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    const teams = await Team.find(filter)
      .populate('captain', 'username fullName')
      .populate('members', 'username fullName score')
      .select('name description score members captain solvedChallenges createdAt')
      .sort({ score: -1, createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Team.countDocuments(filter)

    // Add member count and statistics
    const teamsWithStats = teams.map(team => ({
      id: team._id,
      name: team.name,
      description: team.description,
      score: team.score,
      memberCount: team.members.length,
      captain: team.captain,
      members: team.members,
      solvedCount: team.solvedChallenges.length,
      createdAt: team.createdAt,
      averageScore: team.members.length > 0 ? Math.round(team.score / team.members.length) : 0
    }))

    res.json({
      teams: teamsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get teams error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single team details
router.get('/:teamId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('captain', 'username fullName email score')
      .populate('members', 'username fullName score solvedChallenges lastSolve')
      .populate('solvedChallenges.challenge', 'title category points')

    if (!team || !team.isActive) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Calculate team statistics
    const memberStats = {
      totalMembers: team.members.length,
      totalScore: team.score,
      averageScore: Math.round(team.score / team.members.length),
      totalSolves: team.solvedChallenges.length,
      activeMembers: team.members.filter(member => 
        member.lastSolve > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }

    // Category breakdown
    const categoryStats = {}
    team.solvedChallenges.forEach(solve => {
      const category = solve.challenge.category
      categoryStats[category] = (categoryStats[category] || 0) + 1
    })

    res.json({
      team: {
        id: team._id,
        name: team.name,
        description: team.description,
        captain: team.captain,
        members: team.members,
        solvedChallenges: team.solvedChallenges,
        createdAt: team.createdAt,
        statistics: memberStats,
        categoryStats
      }
    })
  } catch (error) {
    console.error('Get team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new team
router.post('/', [
  authMiddleware,
  body('name').notEmpty().trim().isLength({ min: 3, max: 50 }),
  body('description').optional().trim().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, description } = req.body
    const userId = req.userId

    // Check if user already in a team
    const existingTeam = await Team.findOne({ members: userId })
    if (existingTeam) {
      return res.status(400).json({ error: 'You are already in a team' })
    }

    // Check if team name exists
    const nameExists = await Team.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
    if (nameExists) {
      return res.status(400).json({ error: 'Team name already exists' })
    }

    // Create team
    const team = new Team({
      name,
      description: description || '',
      captain: userId,
      members: [userId]
    })

    await team.save()

    // Update user's team reference
    await User.findByIdAndUpdate(userId, { team: team._id })

    // Populate for response
    await team.populate('captain', 'username fullName')
    await team.populate('members', 'username fullName')

    res.status(201).json({
      message: 'Team created successfully',
      team: {
        id: team._id,
        name: team.name,
        description: team.description,
        captain: team.captain,
        members: team.members,
        score: team.score,
        createdAt: team.createdAt
      }
    })
  } catch (error) {
    console.error('Create team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update team
router.put('/:teamId', [
  authMiddleware,
  body('description').optional().trim().isLength({ max: 200 }),
  body('name').optional().trim().isLength({ min: 3, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const team = await Team.findById(req.params.teamId)
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check if user is captain
    if (team.captain.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only team captain can update team' })
    }

    const { name, description } = req.body
    const updates = {}

    if (name && name !== team.name) {
      // Check if new name is available
      const nameExists = await Team.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: team._id }
      })
      if (nameExists) {
        return res.status(400).json({ error: 'Team name already exists' })
      }
      updates.name = name
    }

    if (description !== undefined) {
      updates.description = description
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.teamId,
      { $set: updates },
      { new: true }
    ).populate('captain', 'username fullName')
     .populate('members', 'username fullName score')

    res.json({
      message: 'Team updated successfully',
      team: updatedTeam
    })
  } catch (error) {
    console.error('Update team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Join team
router.post('/:teamId/join', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
    if (!team || !team.isActive) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check if team is full (max 4 members)
    if (team.members.length >= 4) {
      return res.status(400).json({ error: 'Team is full' })
    }

    // Check if user already in a team
    const user = await User.findById(req.userId)
    if (user.team) {
      return res.status(400).json({ error: 'You are already in a team' })
    }

    // Add user to team
    team.members.push(req.userId)
    await team.save()

    // Update user's team reference
    await User.findByIdAndUpdate(req.userId, { team: team._id })

    // Notify team members
    socketService.sendNotification(team.captain.toString(), {
      type: 'team_join',
      title: 'New Team Member',
      message: `${user.username} has joined your team`,
      team: team.name
    })

    res.json({
      message: 'Successfully joined team',
      team: {
        id: team._id,
        name: team.name,
        memberCount: team.members.length
      }
    })
  } catch (error) {
    console.error('Join team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Leave team
router.post('/:teamId/leave', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check if user is in the team
    if (!team.members.includes(req.userId)) {
      return res.status(400).json({ error: 'You are not in this team' })
    }

    // Check if user is captain
    if (team.captain.toString() === req.userId) {
      return res.status(400).json({ error: 'Captain cannot leave team. Transfer ownership first or disband team.' })
    }

    // Remove user from team
    team.members = team.members.filter(member => member.toString() !== req.userId)
    await team.save()

    // Remove user's team reference
    await User.findByIdAndUpdate(req.userId, { $unset: { team: 1 } })

    res.json({ message: 'Successfully left team' })
  } catch (error) {
    console.error('Leave team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Transfer captaincy
router.post('/:teamId/transfer', [
  authMiddleware,
  body('newCaptainId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { newCaptainId } = req.body
    const team = await Team.findById(req.params.teamId)

    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check if current user is captain
    if (team.captain.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only captain can transfer ownership' })
    }

    // Check if new captain is in the team
    if (!team.members.includes(newCaptainId)) {
      return res.status(400).json({ error: 'New captain must be a team member' })
    }

    // Transfer captaincy
    team.captain = newCaptainId
    await team.save()

    // Notify new captain
    socketService.sendNotification(newCaptainId, {
      type: 'team_promotion',
      title: 'Team Captain',
      message: `You are now the captain of ${team.name}`,
      team: team.name
    })

    res.json({ message: 'Captaincy transferred successfully' })
  } catch (error) {
    console.error('Transfer captaincy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Disband team (captain only)
router.delete('/:teamId', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check if user is captain
    if (team.captain.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only captain can disband team' })
    }

    // Remove team reference from all members
    await User.updateMany(
      { _id: { $in: team.members } },
      { $unset: { team: 1 } }
    )

    // Delete team
    await Team.findByIdAndDelete(req.params.teamId)

    res.json({ message: 'Team disbanded successfully' })
  } catch (error) {
    console.error('Disband team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get team members
router.get('/:teamId/members', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('members', 'username fullName score solvedChallenges lastSolve createdAt')
      .select('members')

    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Add member statistics
    const membersWithStats = team.members.map(member => ({
      id: member._id,
      username: member.username,
      fullName: member.fullName,
      score: member.score,
      solvedCount: member.solvedChallenges.length,
      lastSolve: member.lastSolve,
      joinDate: member.createdAt,
      isCaptain: team.captain.toString() === member._id.toString()
    }))

    res.json({ members: membersWithStats })
  } catch (error) {
    console.error('Get team members error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
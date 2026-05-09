import express from 'express';
import { body, validationResult } from 'express-validator';
import Event from '../models/Event.js';
import Challenge from '../models/Challenge.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = { isPublic: true };
    
    if (status && status !== 'all') {
      const now = new Date();
      switch (status) {
        case 'upcoming':
          filter.startTime = { $gt: now };
          break;
        case 'active':
          filter.startTime = { $lte: now };
          filter.endTime = { $gte: now };
          filter.isActive = true;
          break;
        case 'past':
          filter.endTime = { $lt: now };
          break;
      }
    }

    const events = await Event.find(filter)
      .populate('challenges', 'title category points')
      .sort({ startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('challenges', 'title category points description')
      .populate('participants', 'username email');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Admin: Get all events with admin privileges
router.get('/admin/events', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('challenges', 'title category')
      .populate('participants', 'username email')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    console.error('Get admin events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Admin: Create event
router.post('/admin', [
  authMiddleware,
  body('name').trim().isLength({ min: 1 }).withMessage('Event name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('maxTeamSize').optional().isInt({ min: 1, max: 10 }).withMessage('Max team size must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      startTime,
      endTime,
      maxTeamSize = 4,
      isPublic = true,
      isActive = false,
      rules = [],
      challenges = []
    } = req.body;

    // Check if end time is after start time
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const event = new Event({
      name,
      description,
      startTime,
      endTime,
      maxTeamSize,
      isPublic,
      isActive,
      rules,
      challenges,
      createdBy: req.userId
    });

    await event.save();
    
    // Populate the response
    await event.populate('challenges', 'title category points');

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Admin: Update event
router.put('/admin/:id', [
  authMiddleware,
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Event name cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time is required'),
  body('maxTeamSize').optional().isInt({ min: 1, max: 10 }).withMessage('Max team size must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const {
      name,
      description,
      startTime,
      endTime,
      maxTeamSize,
      isPublic,
      isActive,
      rules,
      challenges
    } = req.body;

    // Update fields if provided
    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    if (startTime !== undefined) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (maxTeamSize !== undefined) event.maxTeamSize = maxTeamSize;
    if (isPublic !== undefined) event.isPublic = isPublic;
    if (isActive !== undefined) event.isActive = isActive;
    if (rules !== undefined) event.rules = rules;
    if (challenges !== undefined) event.challenges = challenges;

    // Validate timing if both are provided
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    await event.save();
    
    // Populate the response
    await event.populate('challenges', 'title category points');
    await event.populate('participants', 'username email');

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Admin: Delete event
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event has participants
    if (event.participants.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete event with active participants. Please remove participants first.' 
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Admin: Toggle event active status
router.patch('/admin/:id/status', [
  authMiddleware,
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.isActive = req.body.isActive;
    await event.save();

    res.json({
      message: `Event ${event.isActive ? 'activated' : 'deactivated'} successfully`,
      event: {
        id: event._id,
        name: event.name,
        isActive: event.isActive
      }
    });
  } catch (error) {
    console.error('Toggle event status error:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

// Admin: Add challenges to event
router.post('/admin/:id/challenges', [
  authMiddleware,
  body('challengeIds').isArray().withMessage('challengeIds must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { challengeIds } = req.body;

    // Verify challenges exist
    const challenges = await Challenge.find({ _id: { $in: challengeIds } });
    if (challenges.length !== challengeIds.length) {
      return res.status(400).json({ error: 'One or more challenges not found' });
    }

    // Add challenges (avoid duplicates)
    const existingChallengeIds = new Set(event.challenges.map(id => id.toString()));
    const newChallenges = challengeIds.filter(id => !existingChallengeIds.has(id));
    
    event.challenges.push(...newChallenges);
    await event.save();

    await event.populate('challenges', 'title category points');

    res.json({
      message: `Added ${newChallenges.length} challenges to event`,
      event
    });
  } catch (error) {
    console.error('Add challenges to event error:', error);
    res.status(500).json({ error: 'Failed to add challenges to event' });
  }
});

// Admin: Remove challenge from event
router.delete('/admin/:eventId/challenges/:challengeId', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const challengeIndex = event.challenges.findIndex(
      challenge => challenge.toString() === req.params.challengeId
    );

    if (challengeIndex === -1) {
      return res.status(404).json({ error: 'Challenge not found in event' });
    }

    event.challenges.splice(challengeIndex, 1);
    await event.save();

    await event.populate('challenges', 'title category points');

    res.json({
      message: 'Challenge removed from event',
      event
    });
  } catch (error) {
    console.error('Remove challenge from event error:', error);
    res.status(500).json({ error: 'Failed to remove challenge from event' });
  }
});

// Admin: Get event statistics
router.get('/admin/:id/statistics', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants', 'username email createdAt')
      .populate('challenges', 'title category points');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const statistics = {
      totalParticipants: event.participants.length,
      totalChallenges: event.challenges.length,
      participationRate: 0, // You can calculate this based on your user base
      averageTeamSize: event.maxTeamSize,
      eventDuration: Math.floor((new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60 * 60 * 24)), // days
      status: event.isActive ? 'active' : new Date() > new Date(event.endTime) ? 'completed' : 'upcoming'
    };

    res.json(statistics);
  } catch (error) {
    console.error('Get event statistics error:', error);
    res.status(500).json({ error: 'Failed to get event statistics' });
  }
});

// Register for event
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.isActive) {
      return res.status(400).json({ error: 'Event is not active' });
    }

    if (new Date() > new Date(event.endTime)) {
      return res.status(400).json({ error: 'Event has ended' });
    }

    // Check if user is already registered
    if (event.participants.includes(req.userId)) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    event.participants.push(req.userId);
    await event.save();

    res.json({
      message: 'Successfully registered for event',
      event: {
        id: event._id,
        name: event.name,
        participants: event.participants.length
      }
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Unregister from event
router.post('/:id/unregister', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const participantIndex = event.participants.findIndex(
      participant => participant.toString() === req.userId
    );

    if (participantIndex === -1) {
      return res.status(400).json({ error: 'Not registered for this event' });
    }

    event.participants.splice(participantIndex, 1);
    await event.save();

    res.json({
      message: 'Successfully unregistered from event',
      event: {
        id: event._id,
        name: event.name,
        participants: event.participants.length
      }
    });
  } catch (error) {
    console.error('Unregister from event error:', error);
    res.status(500).json({ error: 'Failed to unregister from event' });
  }
});

export default router;
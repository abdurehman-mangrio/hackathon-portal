import express from 'express';
import { body, validationResult } from 'express-validator';
import TestSession from '../models/TestSession.js';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint to verify API is working
router.get('/admin/test', authMiddleware, (req, res) => {
  res.json({ 
    message: 'Security API is working!',
    timestamp: new Date().toISOString(),
    version: '1.0',
    user: req.userId
  });
});

// Admin: Get security statistics
router.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    console.log('🔒 Fetching security stats...');
    
    const activeSessions = await TestSession.find({ status: 'active' });
    const terminatedSessions = await TestSession.countDocuments({ status: 'terminated' });
    const disqualifiedSessions = await TestSession.countDocuments({ status: 'disqualified' });

    // Calculate statistics
    const stats = {
      totalSessions: activeSessions.length,
      totalViolations: 0,
      cleanSessions: 0,
      highRiskSessions: 0,
      terminatedSessions: terminatedSessions,
      disqualifiedSessions: disqualifiedSessions,
      webcamAlerts: 0,
      tabSwitchViolations: 0,
      focusViolations: 0
    };

    // Calculate from active sessions
    activeSessions.forEach(session => {
      // Count total violations
      const sessionViolations = session.violations.length;
      stats.totalViolations += sessionViolations;

      // Count webcam alerts
      stats.webcamAlerts += session.monitoring.webcamAlerts.length;

      // Count tab switches
      const tabSwitches = session.monitoring.tabSwitches.reduce((sum, ts) => sum + ts.count, 0);
      stats.tabSwitchViolations += tabSwitches;

      // Count focus violations
      const focusViolations = session.monitoring.focusEvents.filter(event => 
        event.type === 'blur' && event.duration > 5
      ).length;
      stats.focusViolations += focusViolations;

      // Categorize sessions
      if (sessionViolations === 0) {
        stats.cleanSessions++;
      } else if (sessionViolations >= 3) {
        stats.highRiskSessions++;
      }
    });

    console.log('📊 Security stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Get security stats error:', error);
    res.status(500).json({ error: 'Failed to get security statistics' });
  }
});

// Admin: Get active sessions with detailed information
router.get('/admin/active-sessions', authMiddleware, async (req, res) => {
  try {
    console.log('🔒 Fetching active sessions...');
    
    const activeSessions = await TestSession.find({ status: 'active' })
      .populate('user', 'username email fullName')
      .populate('challenge', 'title category points')
      .populate('event', 'name')
      .sort({ startTime: -1 });

    const sessionsWithDetails = activeSessions.map(session => {
      const duration = Math.floor((new Date() - session.startTime) / 1000);
      const tabSwitches = session.monitoring.tabSwitches.reduce((sum, ts) => sum + ts.count, 0);
      const focusViolations = session.monitoring.focusEvents.filter(event => 
        event.type === 'blur' && event.duration > 5
      ).length;
      
      return {
        id: session._id,
        sessionId: session.sessionId,
        user: session.user,
        challenge: session.challenge,
        event: session.event,
        startTime: session.startTime,
        duration: duration,
        violations: session.violations.length,
        webcamAlerts: session.monitoring.webcamAlerts.length,
        tabSwitches: tabSwitches,
        focusViolations: focusViolations,
        ipAddress: session.ipAddress,
        status: session.status,
        security: session.security
      };
    });

    console.log(`👥 Found ${sessionsWithDetails.length} active sessions`);
    res.json({ sessions: sessionsWithDetails });
  } catch (error) {
    console.error('❌ Get active sessions error:', error);
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
});

// Admin: Get violation logs for a specific session
router.get('/admin/:sessionId/violations', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('🔒 Fetching violations for session:', sessionId);

    const session = await TestSession.findOne({ sessionId })
      .populate('user', 'username email');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get violations from session
    const violations = session.violations.map(violation => ({
      id: violation._id,
      type: violation.type,
      severity: violation.severity,
      description: violation.description,
      timestamp: violation.timestamp,
      action: violation.action
    }));

    // Get monitoring events as violations
    const monitoringViolations = [];

    // Webcam alerts as violations
    session.monitoring.webcamAlerts.forEach(alert => {
      monitoringViolations.push({
        id: alert._id,
        type: 'webcam_alert',
        severity: alert.confidence > 0.8 ? 'high' : 'medium',
        description: `Webcam alert: ${alert.type} (confidence: ${(alert.confidence * 100).toFixed(1)}%)`,
        timestamp: alert.timestamp,
        action: 'recorded'
      });
    });

    // Tab switches as violations
    session.monitoring.tabSwitches.forEach(switchEvent => {
      monitoringViolations.push({
        id: switchEvent._id,
        type: 'tab_switch',
        severity: switchEvent.count > 3 ? 'high' : 'medium',
        description: `Tab switch detected (${switchEvent.count} times)`,
        timestamp: switchEvent.timestamp,
        action: 'recorded'
      });
    });

    // Focus violations
    session.monitoring.focusEvents.forEach(focusEvent => {
      if (focusEvent.type === 'blur' && focusEvent.duration > 5) {
        monitoringViolations.push({
          id: focusEvent._id,
          type: 'focus_loss',
          severity: focusEvent.duration > 30 ? 'high' : 'medium',
          description: `Focus lost for ${focusEvent.duration} seconds`,
          timestamp: focusEvent.timestamp,
          action: 'recorded'
        });
      }
    });

    // Combine all violations and sort by timestamp
    const allViolations = [...violations, ...monitoringViolations]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log(`⚠️ Found ${allViolations.length} violations for session ${sessionId}`);
    res.json({ violations: allViolations });
  } catch (error) {
    console.error('❌ Get violation logs error:', error);
    res.status(500).json({ error: 'Failed to get violation logs' });
  }
});

// Admin: Force terminate session
router.post('/admin/:sessionId/force-terminate', [
  authMiddleware,
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    console.log('🛑 Force terminating session:', sessionId, 'Reason:', reason);

    const session = await TestSession.findOne({ sessionId })
      .populate('user', 'username email');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Add violation record
    await session.addViolation(
      'admin_termination',
      'high',
      `Admin forced termination: ${reason || 'No reason provided'}`,
      'terminated'
    );

    // Update session status
    session.status = 'terminated';
    session.endTime = new Date();
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);
    await session.save();

    console.log('✅ Session terminated successfully:', sessionId);
    res.json({
      message: 'Session force terminated successfully',
      session: {
        user: session.user,
        status: session.status,
        endTime: session.endTime,
        duration: session.duration
      }
    });

  } catch (error) {
    console.error('❌ Force terminate session error:', error);
    res.status(500).json({ error: 'Failed to force terminate session' });
  }
});

// Admin: Get all sessions with filters
router.get('/admin/sessions', authMiddleware, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, userId } = req.query;
    
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (dateFrom || dateTo) {
      filter.startTime = {};
      if (dateFrom) filter.startTime.$gte = new Date(dateFrom);
      if (dateTo) filter.startTime.$lte = new Date(dateTo);
    }
    
    if (userId) {
      filter.user = userId;
    }

    const sessions = await TestSession.find(filter)
      .populate('user', 'username email fullName')
      .populate('challenge', 'title category points')
      .populate('event', 'name')
      .sort({ startTime: -1 })
      .limit(100);

    const sessionsWithStats = sessions.map(session => {
      const duration = session.endTime 
        ? Math.floor((session.endTime - session.startTime) / 1000)
        : Math.floor((new Date() - session.startTime) / 1000);
      
      const tabSwitches = session.monitoring.tabSwitches.reduce((sum, ts) => sum + ts.count, 0);
      const focusViolations = session.monitoring.focusEvents.filter(event => 
        event.type === 'blur' && event.duration > 5
      ).length;

      return {
        id: session._id,
        sessionId: session.sessionId,
        user: session.user,
        challenge: session.challenge,
        event: session.event,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: duration,
        violations: session.violations.length,
        webcamAlerts: session.monitoring.webcamAlerts.length,
        tabSwitches: tabSwitches,
        focusViolations: focusViolations,
        ipAddress: session.ipAddress,
        status: session.status,
        security: session.security
      };
    });

    console.log(`📋 Found ${sessionsWithStats.length} sessions with filters`);
    res.json({ sessions: sessionsWithStats });
  } catch (error) {
    console.error('❌ Get all sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Demo data endpoint for testing
router.get('/admin/demo-data', authMiddleware, (req, res) => {
  const demoData = {
    stats: {
      totalSessions: 3,
      totalViolations: 10,
      cleanSessions: 1,
      highRiskSessions: 1,
      terminatedSessions: 2,
      disqualifiedSessions: 1,
      webcamAlerts: 7,
      tabSwitchViolations: 3,
      focusViolations: 4
    },
    sessions: [
      {
        id: '1',
        sessionId: 'sess_001',
        user: { 
          _id: 'user1', 
          username: 'john_doe', 
          email: 'john@example.com',
          fullName: 'John Doe'
        },
        challenge: { 
          _id: 'challenge1',
          title: 'Web Exploitation 101', 
          category: 'web',
          points: 100
        },
        event: {
          _id: 'event1',
          name: 'Winter CTF 2024'
        },
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        duration: 1800,
        violations: 0,
        webcamAlerts: 0,
        tabSwitches: 0,
        focusViolations: 0,
        ipAddress: '192.168.1.100',
        status: 'active',
        security: {
          webcamEnabled: true,
          screenRecording: true,
          tabFocus: true,
          clipboardDisabled: true,
          devToolsDisabled: true
        }
      },
      {
        id: '2',
        sessionId: 'sess_002',
        user: { 
          _id: 'user2',
          username: 'alice_smith', 
          email: 'alice@example.com',
          fullName: 'Alice Smith'
        },
        challenge: { 
          _id: 'challenge2',
          title: 'Cryptography Challenge', 
          category: 'crypto',
          points: 150
        },
        event: {
          _id: 'event1',
          name: 'Winter CTF 2024'
        },
        startTime: new Date(Date.now() - 15 * 60 * 1000),
        duration: 900,
        violations: 3,
        webcamAlerts: 2,
        tabSwitches: 1,
        focusViolations: 1,
        ipAddress: '192.168.1.101',
        status: 'active',
        security: {
          webcamEnabled: true,
          screenRecording: true,
          tabFocus: false,
          clipboardDisabled: true,
          devToolsDisabled: true
        }
      }
    ]
  };
  
  console.log('🎮 Serving demo security data');
  res.json(demoData);
});

export default router;  
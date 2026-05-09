import TestSession from '../models/TestSession.js'
import User from '../models/User.js'
import Challenge from '../models/Challenge.js'
import socketService from './socketService.js'

export class SecurityMonitor {
  constructor() {
    this.activeSessions = new Map()
    this.violationHandlers = new Map()
  }

  // Initialize monitoring for a session
  async initializeSession(sessionId, userId, challengeId, securityConfig) {
    try {
      const session = await TestSession.findOne({ sessionId })
      if (!session) {
        throw new Error('Session not found')
      }

      // Store session in active sessions
      this.activeSessions.set(sessionId, {
        session,
        startTime: new Date(),
        violations: 0,
        lastScreenshot: null,
        webcamStatus: 'initializing'
      })

      // Setup violation handlers
      this.setupViolationHandlers(sessionId, securityConfig)

      // Start monitoring intervals
      this.startMonitoring(sessionId, securityConfig)

      return session
    } catch (error) {
      console.error('Error initializing security session:', error)
      throw error
    }
  }

  setupViolationHandlers(sessionId, config) {
    this.violationHandlers.set(sessionId, {
      handleWebcamViolation: async (violation) => {
        const session = this.activeSessions.get(sessionId)
        if (!session) return

        await session.session.addWebcamAlert(
          violation.type,
          violation.confidence,
          violation.screenshot
        )

        if (violation.type === 'multiple_faces' || violation.type === 'no_face') {
          await this.handleCriticalViolation(sessionId, 'webcam', violation)
        }
      },

      handleTabSwitch: async (data) => {
        const session = this.activeSessions.get(sessionId)
        if (!session) return

        session.session.monitoring.tabSwitches.push({
          timestamp: new Date(),
          count: data.count,
          urls: data.urls || []
        })

        if (data.count > config.browserRestrictions.maxTabSwitches) {
          await this.handleCriticalViolation(sessionId, 'tab_switch', data)
        }

        await session.session.save()
      },

      handleFocusLoss: async (duration) => {
        const session = this.activeSessions.get(sessionId)
        if (!session) return

        session.session.monitoring.focusEvents.push({
          timestamp: new Date(),
          type: 'blur',
          duration
        })

        if (duration > config.violationThresholds.maxFocusLoss) {
          await this.handleCriticalViolation(sessionId, 'focus_loss', { duration })
        }

        await session.session.save()
      }
    })
  }

  async handleCriticalViolation(sessionId, violationType, data) {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    const config = await this.getSecurityConfig()
    let action = 'warning'

    switch (violationType) {
      case 'webcam':
        action = config.violationActions.webcamViolation
        break
      case 'tab_switch':
        action = config.violationActions.tabSwitchViolation
        break
      case 'focus_loss':
        action = config.violationActions.focusViolation
        break
    }

    await session.session.addViolation(
      violationType,
      'high',
      `Automatic detection: ${violationType}`,
      action
    )

    // Notify via socket
    socketService.sendNotification(session.session.user.toString(), {
      type: 'security_violation',
      title: 'Security Violation Detected',
      message: `Violation: ${violationType}. Action: ${action}`,
      severity: 'high'
    })

    // Terminate session if required
    if (action === 'terminate' || action === 'disqualify') {
      await this.terminateSession(sessionId, `Automatic termination due to ${violationType}`)
    }
  }

  startMonitoring(sessionId, config) {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    // Webcam monitoring interval
    session.webcamInterval = setInterval(async () => {
      await this.checkWebcamStatus(sessionId)
    }, config.monitoring.webcamCheckInterval * 1000)

    // Screenshot interval
    session.screenshotInterval = setInterval(async () => {
      await this.captureScreenshot(sessionId)
    }, config.monitoring.screenshotInterval * 1000)

    // Auto-terminate timer
    if (config.sessionSettings.maxDuration) {
      session.autoTerminateTimer = setTimeout(async () => {
        await this.terminateSession(sessionId, 'Maximum duration reached')
      }, config.sessionSettings.maxDuration * 1000)
    }
  }

  async checkWebcamStatus(sessionId) {
    // This would integrate with the frontend webcam monitoring
    // For now, it's a placeholder for the actual implementation
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    // In a real implementation, this would receive status from the frontend
    console.log(`Checking webcam status for session ${sessionId}`)
  }

  async captureScreenshot(sessionId) {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    // This would be triggered by the frontend
    // The frontend would capture and send screenshots periodically
    console.log(`Capturing screenshot for session ${sessionId}`)
  }

  async terminateSession(sessionId, reason = 'Session terminated') {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    // Clear intervals
    if (session.webcamInterval) clearInterval(session.webcamInterval)
    if (session.screenshotInterval) clearInterval(session.screenshotInterval)
    if (session.autoTerminateTimer) clearTimeout(session.autoTerminateTimer)

    // Update session
    await session.session.terminateSession(reason)

    // Remove from active sessions
    this.activeSessions.delete(sessionId)
    this.violationHandlers.delete(sessionId)

    // Notify user
    socketService.sendNotification(session.session.user.toString(), {
      type: 'session_terminated',
      title: 'Session Terminated',
      message: reason,
      severity: 'critical'
    })

    return session.session
  }

  async getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId)
    if (!session) return null

    return {
      sessionId,
      status: session.session.status,
      startTime: session.startTime,
      violations: session.violations,
      webcamStatus: session.webcamStatus,
      duration: Math.floor((new Date() - session.startTime) / 1000)
    }
  }

  async getSecurityConfig() {
    const SecuritySettings = await import('../models/SecuritySettings.js')
    let config = await SecuritySettings.default.findOne()
    
    if (!config) {
      config = new SecuritySettings.default()
      await config.save()
    }
    
    return config
  }
}

export default new SecurityMonitor()
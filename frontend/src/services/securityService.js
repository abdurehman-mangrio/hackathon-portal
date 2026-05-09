import api from './api.js';

export const securityService = {
  // Test API connectivity
  testConnection: async () => {
    try {
      const response = await api.get('/securesession/admin/test');
      console.log('✅ Security API connection successful');
      return response.data;
    } catch (error) {
      console.log('❌ Security API test failed:', error.message);
      throw new Error('Security API is not available');
    }
  },

  // Get active sessions
  getActiveSessions: async () => {
    try {
      const response = await api.get('/securesession/admin/active-sessions');
      console.log('✅ Active sessions fetched:', response.data.sessions?.length || 0);
      return response.data;
    } catch (error) {
      console.log('⚠️ Active sessions endpoint failed, using demo data');
      // Try demo data endpoint
      try {
        const demoResponse = await api.get('/securesession/admin/demo-data');
        return { sessions: demoResponse.data.sessions, isDemo: true };
      } catch (demoError) {
        // Return fallback demo data
        return {
          sessions: [
            {
              id: 'demo1',
              sessionId: 'demo_sess_001',
              user: { 
                _id: 'user1', 
                username: 'demo_user', 
                email: 'demo@example.com',
                fullName: 'Demo User'
              },
              challenge: { 
                _id: 'challenge1',
                title: 'Web Security Challenge', 
                category: 'web',
                points: 100
              },
              event: {
                _id: 'event1',
                name: 'Demo CTF 2024'
              },
              startTime: new Date(Date.now() - 25 * 60 * 1000),
              duration: 1500,
              violations: 2,
              webcamAlerts: 1,
              tabSwitches: 1,
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
              id: 'demo2',
              sessionId: 'demo_sess_002',
              user: { 
                _id: 'user2',
                username: 'test_user', 
                email: 'test@example.com',
                fullName: 'Test User'
              },
              challenge: { 
                _id: 'challenge2',
                title: 'Cryptography Basics', 
                category: 'crypto',
                points: 150
              },
              event: null,
              startTime: new Date(Date.now() - 45 * 60 * 1000),
              duration: 2700,
              violations: 5,
              webcamAlerts: 3,
              tabSwitches: 2,
              focusViolations: 2,
              ipAddress: '192.168.1.101',
              status: 'active',
              security: {
                webcamEnabled: false,
                screenRecording: true,
                tabFocus: false,
                clipboardDisabled: true,
                devToolsDisabled: true
              }
            }
          ],
          isDemo: true
        };
      }
    }
  },

  // Get security statistics
  getSecurityStats: async () => {
    try {
      const response = await api.get('/securesession/admin/stats');
      console.log('✅ Security stats fetched');
      return response.data;
    } catch (error) {
      console.log('⚠️ Stats endpoint failed, using demo data');
      // Try demo data endpoint
      try {
        const demoResponse = await api.get('/securesession/admin/demo-data');
        return { ...demoResponse.data.stats, isDemo: true };
      } catch (demoError) {
        // Return fallback demo stats
        return {
          totalSessions: 2,
          totalViolations: 7,
          cleanSessions: 0,
          highRiskSessions: 1,
          terminatedSessions: 0,
          disqualifiedSessions: 0,
          webcamAlerts: 4,
          tabSwitchViolations: 3,
          focusViolations: 2,
          isDemo: true
        };
      }
    }
  },

  // Get violation logs for a session
  getViolationLogs: async (sessionId) => {
    try {
      const response = await api.get(`/securesession/admin/${sessionId}/violations`);
      console.log(`✅ Violations fetched for session ${sessionId}:`, response.data.violations?.length || 0);
      return response.data;
    } catch (error) {
      console.log('⚠️ Violations endpoint failed, using demo data');
      // Return mock violations for demo
      return { 
        violations: [
          {
            id: 'v1',
            type: 'tab_switch',
            severity: 'medium',
            description: 'User switched tabs 2 times during challenge',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            action: 'recorded'
          },
          {
            id: 'v2',
            type: 'webcam_alert',
            severity: 'high',
            description: 'No face detected in webcam for 15 seconds',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            action: 'recorded'
          },
          {
            id: 'v3',
            type: 'focus_loss',
            severity: 'medium',
            description: 'Browser window lost focus for 8 seconds',
            timestamp: new Date(Date.now() - 3 * 60 * 1000),
            action: 'recorded'
          }
        ],
        isDemo: true 
      };
    }
  },

  // Terminate session
  terminateSession: async (sessionId, reason) => {
    try {
      const response = await api.post(`/securesession/admin/${sessionId}/force-terminate`, { reason });
      console.log(`✅ Session ${sessionId} terminated via API`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Terminate endpoint failed, but continuing with local state update');
      // If endpoint doesn't exist, just log and continue
      return { message: 'Session terminated locally', isDemo: true };
    }
  },

  // Get session details
  getSessionDetails: async (sessionId) => {
    try {
      const response = await api.get(`/securesession/admin/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Session details endpoint failed');
      throw error;
    }
  },

  // Get all sessions with filters
  getAllSessions: async (filters = {}) => {
    try {
      const response = await api.get('/securesession/admin/sessions', { params: filters });
      return response.data;
    } catch (error) {
      console.log('⚠️ All sessions endpoint failed');
      return { sessions: [], isDemo: true };
    }
  }
};
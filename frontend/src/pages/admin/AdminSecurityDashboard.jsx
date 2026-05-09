import React, { useState, useEffect, useCallback } from 'react';
import { securityService } from '../../services/securityService';

const AdminSecurityDashboard = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionViolations, setSessionViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [securityStats, setSecurityStats] = useState({
    totalSessions: 0,
    totalViolations: 0,
    cleanSessions: 0,
    highRiskSessions: 0,
    terminatedSessions: 0,
    disqualifiedSessions: 0,
    webcamAlerts: 0,
    tabSwitchViolations: 0,
    focusViolations: 0
  });

  // Check API connectivity
  const checkApiConnectivity = useCallback(async () => {
    try {
      const result = await securityService.testConnection();
      setApiStatus('connected');
      return true;
    } catch (error) {
      console.log('API connection test failed:', error.message);
      if (error.message.includes('not implemented')) {
        setApiStatus('not_implemented');
      } else {
        setApiStatus('error');
      }
      return false;
    }
  }, []);

  // Fetch all security data
  const fetchSecurityData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setIsRefreshing(true);
      setError(null);

      // Check API connectivity first
      const isApiConnected = await checkApiConnectivity();
      
      if (isApiConnected) {
        console.log('🔄 Fetching real security data from API...');
        const [sessionsResponse, statsResponse] = await Promise.all([
          securityService.getActiveSessions(),
          securityService.getSecurityStats()
        ]);
        
        console.log('✅ Real data received:', { 
          sessions: sessionsResponse.sessions?.length, 
          stats: statsResponse 
        });
        
        setActiveSessions(sessionsResponse.sessions || []);
        setSecurityStats(statsResponse);
        setLastUpdated(new Date());
        
        if (sessionsResponse.isDemo || statsResponse.isDemo) {
          setApiStatus('demo');
        }
      } else {
        // Use demo data with clear indication
        console.log('🎮 Using demo data - API not available');
        const sessionsResponse = await securityService.getActiveSessions();
        const statsResponse = await securityService.getSecurityStats();
        
        setActiveSessions(sessionsResponse.sessions || []);
        setSecurityStats(statsResponse);
        setLastUpdated(new Date());
        
        if (apiStatus === 'not_implemented') {
          setError('Security API endpoints not implemented yet. Using demo data.');
        } else {
          setError('Security API is not available. Using demo data.');
        }
      }
      
    } catch (error) {
      console.error('❌ Error in fetchSecurityData:', error);
      setError(error.message);
      
      // Fallback to demo data
      const sessionsResponse = await securityService.getActiveSessions();
      const statsResponse = await securityService.getSecurityStats();
      
      setActiveSessions(sessionsResponse.sessions || []);
      setSecurityStats(statsResponse);
      setLastUpdated(new Date());
      
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [checkApiConnectivity, apiStatus]);

  // Fetch violation details for a specific session
  const fetchSessionViolations = async (sessionId) => {
    try {
      const response = await securityService.getViolationLogs(sessionId);
      setSessionViolations(response.violations || []);
    } catch (error) {
      console.error('Error fetching violation logs:', error);
      setSessionViolations([]);
    }
  };

  // Terminate session with confirmation
  const terminateSession = async (sessionId, reason) => {
    if (!window.confirm(`Are you sure you want to terminate session ${sessionId}?\n\nReason: ${reason}`)) {
      return;
    }

    try {
      await securityService.terminateSession(sessionId, reason);
      
      // Update local state
      setActiveSessions(prev => prev.filter(session => session.sessionId !== sessionId));
      setSelectedSession(null);
      
      // Show success message
      console.log(`✅ Session ${sessionId} terminated successfully`);
      
      // Refresh data
      await fetchSecurityData(false);
      
    } catch (error) {
      console.error('Error terminating session:', error);
      // Even if API fails, update local state for demo
      setActiveSessions(prev => prev.filter(session => session.sessionId !== sessionId));
      setSelectedSession(null);
    }
  };

  // View session details
  const viewSessionDetails = async (session) => {
    setSelectedSession(session);
    await fetchSessionViolations(session.sessionId);
  };

  // Auto-refresh only when API is connected
  useEffect(() => {
    fetchSecurityData();

    const interval = setInterval(() => {
      if (apiStatus === 'connected') {
        fetchSecurityData(false);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchSecurityData, apiStatus]);

  // Severity color mapping
  const getSeverityColor = (violations) => {
    if (violations === 0) return 'bg-green-500';
    if (violations <= 2) return 'bg-yellow-500';
    if (violations <= 5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get risk level text
  const getRiskLevel = (violations) => {
    if (violations === 0) return 'Low';
    if (violations <= 2) return 'Medium';
    if (violations <= 5) return 'High';
    return 'Critical';
  };

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading security monitoring data...</div>
          <div className="text-sm text-gray-500 mt-2">Checking API connection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Security Monitoring Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of active test sessions and security violations
            {lastUpdated && (
              <span className="text-sm ml-2">
                (Last updated: {lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchSecurityData(false)}
          disabled={isRefreshing}
          className="mt-4 lg:mt-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          {isRefreshing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* API Status Indicator */}
      <div className={`p-4 rounded-lg ${
        apiStatus === 'connected' ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' :
        apiStatus === 'demo' ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
        apiStatus === 'not_implemented' ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
        'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            apiStatus === 'connected' ? 'bg-green-500' :
            apiStatus === 'demo' ? 'bg-blue-500' :
            apiStatus === 'not_implemented' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}></div>
          <div>
            <span className={`font-medium ${
              apiStatus === 'connected' ? 'text-green-800 dark:text-green-400' :
              apiStatus === 'demo' ? 'text-blue-800 dark:text-blue-400' :
              apiStatus === 'not_implemented' ? 'text-yellow-800 dark:text-yellow-400' :
              'text-red-800 dark:text-red-400'
            }`}>
              {apiStatus === 'connected' ? '✅ Connected to Security API' :
               apiStatus === 'demo' ? '🔵 Using Demo Data' :
               apiStatus === 'not_implemented' ? '⚠️ Backend Endpoints Not Implemented' :
               '❌ Cannot Connect to Security API'}
            </span>
            <p className={`text-sm mt-1 ${
              apiStatus === 'connected' ? 'text-green-700 dark:text-green-300' :
              apiStatus === 'demo' ? 'text-blue-700 dark:text-blue-300' :
              apiStatus === 'not_implemented' ? 'text-yellow-700 dark:text-yellow-300' :
              'text-red-700 dark:text-red-300'
            }`}>
              {apiStatus === 'connected' ? 'Displaying real-time security data from your backend.' :
               apiStatus === 'demo' ? 'Showing demo data. Real monitoring will begin when sessions are active.' :
               apiStatus === 'not_implemented' ? 'Add the provided backend routes to enable real data. Currently showing demo data.' :
               'Check if your backend is running on http://localhost:5000. Currently showing demo data.'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-yellow-800 dark:text-yellow-400">{error}</span>
          </div>
        </div>
      )}

      {/* Security Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          value={securityStats.totalSessions} 
          label="Active Sessions" 
          color="blue" 
          icon="👥"
        />
        <StatCard 
          value={securityStats.totalViolations} 
          label="Total Violations" 
          color="red" 
          icon="⚠️"
        />
        <StatCard 
          value={securityStats.cleanSessions} 
          label="Clean Sessions" 
          color="green" 
          icon="✅"
        />
        <StatCard 
          value={securityStats.highRiskSessions} 
          label="High Risk" 
          color="orange" 
          icon="🔴"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{securityStats.webcamAlerts}</div>
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Webcam Alerts</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{securityStats.tabSwitchViolations}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Tab Switches</div>
        </div>
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-pink-600 dark:text-pink-400">{securityStats.focusViolations}</div>
          <div className="text-sm text-pink-600 dark:text-pink-400 font-medium">Focus Loss</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-gray-600 dark:text-gray-400">{securityStats.terminatedSessions}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Terminated</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-red-600 dark:text-red-400">{securityStats.disqualifiedSessions}</div>
          <div className="text-sm text-red-600 dark:text-red-400 font-medium">Disqualified</div>
        </div>
      </div>

      {/* Active Sessions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Test Sessions ({activeSessions.length})
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {apiStatus === 'connected' ? 'Auto-refreshes every 15 seconds' : 'Demo Mode - No Auto-refresh'}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User & Challenge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Security Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {activeSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {session.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {session.user.email}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {session.challenge.title} • {session.challenge.category}
                        </div>
                        {session.event && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {session.event.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDuration(session.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(session.violations)} text-white`}>
                      {getRiskLevel(session.violations)}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {session.violations} violations
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${session.security.webcamEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs">Webcam: {session.security.webcamEnabled ? 'On' : 'Off'}</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${session.security.tabFocus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs">Focus: {session.security.tabFocus ? 'Active' : 'Lost'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {session.ipAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewSessionDetails(session)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => terminateSession(session.sessionId, 'Admin manual termination')}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      Terminate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {activeSessions.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No active sessions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {apiStatus === 'connected' 
                  ? 'There are no active test sessions to monitor.' 
                  : 'No demo sessions available.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          violations={sessionViolations}
          onClose={() => setSelectedSession(null)}
          onTerminate={terminateSession}
          apiStatus={apiStatus}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ value, label, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400'
  };

  return (
    <div className={`rounded-lg p-6 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm font-medium mt-1">{label}</div>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
};

// Session Detail Modal Component
const SessionDetailModal = ({ session, violations, onClose, onTerminate, apiStatus }) => {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Details</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Session ID: {session.sessionId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Session Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Session Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {session.user.username} ({session.user.email})
                  {session.user.fullName && ` - ${session.user.fullName}`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Challenge</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {session.challenge.title} ({session.challenge.category}) - {session.challenge.points} points
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDuration(session.duration)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</label>
                <p className="text-sm text-gray-900 dark:text-white">{session.ipAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(session.startTime).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <p className="text-sm text-gray-900 dark:text-white capitalize">{session.status}</p>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Security Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg text-center ${
                session.security.webcamEnabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className={`text-lg font-bold ${
                  session.security.webcamEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {session.security.webcamEnabled ? '🟢' : '🔴'}
                </div>
                <div className="text-xs">Webcam</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${
                session.security.screenRecording ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                <div className={`text-lg font-bold ${
                  session.security.screenRecording ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {session.security.screenRecording ? '🟢' : '🟡'}
                </div>
                <div className="text-xs">Recording</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${
                session.security.tabFocus ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className={`text-lg font-bold ${
                  session.security.tabFocus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {session.security.tabFocus ? '🟢' : '🔴'}
                </div>
                <div className="text-xs">Focus</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${
                session.security.clipboardDisabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                <div className={`text-lg font-bold ${
                  session.security.clipboardDisabled ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {session.security.clipboardDisabled ? '🟢' : '🟡'}
                </div>
                <div className="text-xs">Clipboard</div>
              </div>
            </div>
          </div>

          {/* Violation Statistics */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Violation Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">{session.violations}</div>
                <div className="text-sm text-red-600 dark:text-red-400">Total Violations</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{session.webcamAlerts || 0}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Webcam Alerts</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{session.tabSwitches || 0}</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Tab Switches</div>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-pink-600 dark:text-pink-400">{session.focusViolations || 0}</div>
                <div className="text-sm text-pink-600 dark:text-pink-400">Focus Loss</div>
              </div>
            </div>
          </div>

          {/* Violation Logs */}
          {violations.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Recent Violations ({violations.length})
              </h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {violations.map((violation) => (
                  <div key={violation.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {violation.type.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            violation.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            violation.severity === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {violation.severity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {violation.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(violation.timestamp).toLocaleString()}</span>
                      <span className="capitalize">Action: {violation.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {violations.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No violations recorded for this session</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {apiStatus === 'connected' ? '✅ Connected to live data' : '🔵 Viewing demo data'}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                <button
                  onClick={() => onTerminate(session.sessionId, 'Admin review termination')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Terminate Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurityDashboard;
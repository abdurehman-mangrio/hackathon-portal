// src/pages/admin/SessionMonitor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { securityService } from '../../services/securityService';

const SessionMonitor = () => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showViolationsModal, setShowViolationsModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'startTime',
    sortOrder: 'desc'
  });

  // Fetch sessions and stats from real API
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sessionsData, statsData] = await Promise.all([
        securityService.getActiveSessions(),
        securityService.getSecurityStats()
      ]);
      
      setSessions(sessionsData.sessions || []);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to load session data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Session actions
  const handleViewViolations = async (session) => {
    try {
      setActionLoading(true);
      const data = await securityService.getViolationLogs(session.sessionId);
      setViolations(data.violations || []);
      setSelectedSession(session);
      setShowViolationsModal(true);
    } catch (err) {
      console.error('Error fetching violations:', err);
      setError(err.message || 'Failed to load violation logs.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateSession = (session) => {
    setSelectedSession(session);
    setShowTerminateModal(true);
  };

  const confirmTerminateSession = async () => {
    if (!selectedSession) return;

    try {
      setActionLoading(true);
      await securityService.terminateSession(selectedSession.sessionId, 'Admin terminated');
      await fetchSessions();
      setShowTerminateModal(false);
      setSelectedSession(null);
    } catch (err) {
      console.error('Error terminating session:', err);
      setError(err.message || 'Failed to terminate session. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getSessionDuration = (startTime, duration) => {
    if (duration) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    }
    
    if (startTime) {
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now - start;
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
    
    return 'Unknown';
  };

  const getRiskLevel = (session) => {
    const totalViolations = (session.violations || 0) + (session.webcamAlerts || 0) + (session.tabSwitches || 0) + (session.focusViolations || 0);
    
    if (totalViolations >= 5) return 'high';
    if (totalViolations >= 2) return 'medium';
    return 'low';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesUser = session.user?.username?.toLowerCase().includes(searchTerm);
      const matchesChallenge = session.challenge?.title?.toLowerCase().includes(searchTerm);
      const matchesIP = session.ipAddress?.includes(searchTerm);
      
      if (!matchesUser && !matchesChallenge && !matchesIP) {
        return false;
      }
    }
    
    if (filters.status !== 'all' && session.status !== filters.status) {
      return false;
    }
    
    return true;
  });

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const aValue = a[filters.sortBy] || '';
    const bValue = b[filters.sortBy] || '';
    
    if (filters.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading session data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session Monitor</h1>
            <p className="text-gray-600 mt-2">
              Monitor active test sessions and security violations in real-time
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <StatCard value={stats.totalSessions} label="Total Sessions" color="blue" />
            <StatCard value={stats.totalViolations} label="Total Violations" color="red" />
            <StatCard value={stats.cleanSessions} label="Clean Sessions" color="green" />
            <StatCard value={stats.highRiskSessions} label="High Risk" color="red" />
            <StatCard value={stats.webcamAlerts} label="Webcam Alerts" color="yellow" />
            <StatCard value={stats.tabSwitchViolations} label="Tab Switches" color="purple" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search users, challenges, IP..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="terminated">Terminated</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="startTime">Start Time</option>
                <option value="user.username">User</option>
                <option value="challenge.title">Challenge</option>
                <option value="violations">Violations</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User & Challenge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security Metrics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSessions.map((session) => (
                  <SessionTableRow
                    key={session.sessionId}
                    session={session}
                    onViewViolations={handleViewViolations}
                    onTerminate={handleTerminateSession}
                    getSessionDuration={getSessionDuration}
                    getRiskLevel={getRiskLevel}
                    getRiskColor={getRiskColor}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {sortedSessions.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No active sessions found
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.status !== 'all'
                  ? 'No sessions match your current filters.'
                  : 'There are no active test sessions at the moment.'
                }
              </p>
              {(filters.search || filters.status !== 'all') && (
                <button
                  onClick={() => setFilters({ search: '', status: 'all', sortBy: 'startTime', sortOrder: 'desc' })}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Loading State for Table */}
          {loading && sortedSessions.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            Auto-refreshing every 30 seconds
          </div>
        </div>

        {/* Violations Modal */}
        {showViolationsModal && (
          <ViolationsModal
            session={selectedSession}
            violations={violations}
            loading={actionLoading}
            onClose={() => {
              setShowViolationsModal(false);
              setSelectedSession(null);
              setViolations([]);
            }}
          />
        )}

        {/* Terminate Confirmation Modal */}
        {showTerminateModal && (
          <TerminateModal
            session={selectedSession}
            onClose={() => {
              setShowTerminateModal(false);
              setSelectedSession(null);
            }}
            onConfirm={confirmTerminateSession}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

// Session Table Row Component
const SessionTableRow = ({ session, onViewViolations, onTerminate, getSessionDuration, getRiskLevel, getRiskColor }) => {
  const riskLevel = getRiskLevel(session);
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {session.user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {session.user?.username || 'Unknown User'}
            </div>
            <div className="text-sm text-gray-500">
              {session.challenge?.title || 'No Challenge'}
            </div>
            <div className="text-xs text-gray-400">
              Started: {session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-medium">
          {getSessionDuration(session.startTime, session.duration)}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center text-xs">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
            Violations: {session.violations || 0}
          </div>
          <div className="flex items-center text-xs">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
            Webcam: {session.webcamAlerts || 0}
          </div>
          <div className="flex items-center text-xs">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
            Tab Switches: {session.tabSwitches || 0}
          </div>
          <div className="flex items-center text-xs">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
            Focus Loss: {session.focusViolations || 0}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-mono">
          {session.ipAddress || 'Unknown'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(riskLevel)}`}>
          {riskLevel.toUpperCase()} RISK
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onViewViolations(session)}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View Violations"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={() => onTerminate(session)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Terminate Session"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

// Violations Modal Component
const ViolationsModal = ({ session, violations, loading, onClose }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Violation Logs - {session?.user?.username}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Challenge: <strong>{session?.challenge?.title}</strong> | 
            Session: <strong>{session?.sessionId}</strong> | 
            IP: <strong>{session?.ipAddress}</strong>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : violations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Violations</h3>
              <p className="text-gray-500">No security violations detected for this session.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {violations.map((violation, index) => (
                <div
                  key={violation.id || index}
                  className={`border rounded-lg p-4 ${getSeverityColor(violation.severity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold capitalize">{violation.type}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {violation.timestamp ? new Date(violation.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{violation.description}</p>
                  <div className="text-xs text-gray-600">
                    Action: <span className="font-medium">{violation.action}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Terminate Modal Component
const TerminateModal = ({ session, onClose, onConfirm, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Terminate Session
          </h2>
          
          <p className="text-gray-600 text-center mb-4">
            Are you sure you want to terminate the session for <strong>{session?.user?.username}</strong>?
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-700">
                This will immediately end the user's test session.
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              {loading ? 'Terminating...' : 'Terminate Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionMonitor;
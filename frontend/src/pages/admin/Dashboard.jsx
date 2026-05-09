import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/adminService';
import { analyticsService } from '../../services/analyticsService';

const AdminDashboard = () => {
  const { user, isDemo } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalChallenges: 0,
    activeChallenges: 0,
    totalSubmissions: 0,
    todaySubmissions: 0,
    totalTeams: 0,
    systemStatus: 'operational'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  const loadDashboardData = async () => {
    // Frontend-only demo mode (no backend deployment required)
    if (isDemo) {
      setIsLoading(true);
      setError(null);

      const demoStats = {
        totalUsers: 42,
        activeUsers: 12,
        totalChallenges: 18,
        activeChallenges: 6,
        totalSubmissions: 530,
        todaySubmissions: 38,
        totalTeams: 9,
        systemStatus: 'operational'
      };

      const demoRecentActivity = [
        {
          _id: 'demo-1',
          user: { username: 'admin' },
          action: 'solved a challenge',
          challenge: 'Web Exploit Basics',
          timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          category: 'Web'
        },
        {
          _id: 'demo-2',
          user: { username: 'user' },
          action: 'registered for event',
          challenge: 'Docker Challenge',
          timestamp: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
          category: 'CTF'
        }
      ];

      const demoHealth = {
        api: { status: 'operational', message: 'API responding normally' },
        database: { status: 'operational', message: 'MongoDB connected' },
        websocket: { status: 'operational', message: 'Real-time channel healthy' },
        auth: { status: 'operational', message: 'JWT auth ready' }
      };

      setTimeout(() => {
        setStats(demoStats);
        setRecentActivity(demoRecentActivity);
        setSystemHealth(demoHealth);
        setIsLoading(false);
      }, 300);

      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [dashboardStats, activity, health] = await Promise.all([
        adminService.getDashboardStats(),
        analyticsService.getRecentActivity(10),
        adminService.getSystemHealth()
      ]);

      setStats(dashboardStats);
      setRecentActivity(activity);
      setSystemHealth(health);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'border-green-500';
      case 'degraded': return 'border-yellow-500';
      case 'down': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'operational': return 'All systems operational';
      case 'degraded': return 'System performance degraded';
      case 'down': return 'System outage detected';
      default: return 'Unknown status';
    }
  };

  const getHealthStatus = (service) => {
    return systemHealth[service] || { status: 'unknown', message: 'Status unavailable' };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 p-6 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 p-6 rounded-lg h-96"></div>
            <div className="bg-gray-200 p-6 rounded-lg h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-red-800 font-medium">{error}</h3>
              <button
                onClick={loadDashboardData}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 text-lg">
          Here's what's happening with your platform today.
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <button
            onClick={loadDashboardData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Data</span>
          </button>
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${getStatusColor(stats.systemStatus)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
              <p className="text-gray-600">{getStatusText(stats.systemStatus)}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              stats.systemStatus === 'operational' ? 'bg-green-500' :
              stats.systemStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800">Users Online</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.activeUsers}</p>
          <p className="text-gray-600">out of {stats.totalUsers} total users</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-800">Challenges</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.activeChallenges}</p>
          <p className="text-gray-600">active of {stats.totalChallenges} total</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-800">Submissions Today</h3>
          <p className="text-2xl font-bold text-green-600">{stats.todaySubmissions}</p>
          <p className="text-gray-600">{stats.totalSubmissions} total submissions</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold text-gray-800">Teams</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.totalTeams}</p>
          <p className="text-gray-600">active teams competing</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-800">Success Rate</h3>
          <p className="text-2xl font-bold text-red-600">
            {stats.totalSubmissions > 0 ? Math.round((stats.todaySubmissions / stats.totalSubmissions) * 100) : 0}%
          </p>
          <p className="text-gray-600">today's success rate</p>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Recent Activity</h3>
            <span className="text-sm text-gray-500">{recentActivity.length} activities</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <div key={activity._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {activity.user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{activity.user?.username || 'Unknown user'}</span> {activity.action}
                      {activity.challenge && (
                        <span className="font-medium"> {activity.challenge}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Recent'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    activity.action.includes('solved') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.category || 'General'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/admin/users"
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center hover:bg-blue-100 transition-colors group"
            >
              <div className="text-blue-600 text-2xl mb-2 group-hover:scale-110 transition-transform">👥</div>
              <div className="text-sm font-medium text-blue-700">Manage Users</div>
              <div className="text-xs text-blue-600 mt-1">{stats.totalUsers} users</div>
            </a>
            <a
              href="/admin/challenges"
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center hover:bg-purple-100 transition-colors group"
            >
              <div className="text-purple-600 text-2xl mb-2 group-hover:scale-110 transition-transform">🎯</div>
              <div className="text-sm font-medium text-purple-700">Challenges</div>
              <div className="text-xs text-purple-600 mt-1">{stats.totalChallenges} challenges</div>
            </a>
            <a
              href="/admin/security"
              className="p-4 bg-red-50 border border-red-200 rounded-lg text-center hover:bg-red-100 transition-colors group"
            >
              <div className="text-red-600 text-2xl mb-2 group-hover:scale-110 transition-transform">🛡️</div>
              <div className="text-sm font-medium text-red-700">Security</div>
              <div className="text-xs text-red-600 mt-1">Monitor access</div>
            </a>
            <a
              href="/admin/analytics"
              className="p-4 bg-green-50 border border-green-200 rounded-lg text-center hover:bg-green-100 transition-colors group"
            >
              <div className="text-green-600 text-2xl mb-2 group-hover:scale-110 transition-transform">📈</div>
              <div className="text-sm font-medium text-green-700">Analytics</div>
              <div className="text-xs text-green-600 mt-1">View insights</div>
            </a>
          </div>

          {/* System Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">System Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  try {
                    await adminService.createBackup();
                    alert('Backup created successfully!');
                  } catch (error) {
                    alert('Failed to create backup');
                  }
                }}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center hover:bg-yellow-100 transition-colors"
              >
                <div className="text-yellow-600 text-lg mb-1">💾</div>
                <div className="text-xs font-medium text-yellow-700">Create Backup</div>
              </button>
              <a
                href="/admin/system"
                className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center hover:bg-indigo-100 transition-colors"
              >
                <div className="text-indigo-600 text-lg mb-1">⚙️</div>
                <div className="text-xs font-medium text-indigo-700">System Settings</div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">System Health</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            stats.systemStatus === 'operational' ? 'bg-green-100 text-green-800' :
            stats.systemStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {stats.systemStatus}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(systemHealth).map(([service, status]) => (
            <div key={service} className={`text-center p-4 border rounded-lg ${
              status.status === 'operational' ? 'bg-green-50 border-green-200' :
              status.status === 'degraded' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className={`text-2xl mb-2 ${
                status.status === 'operational' ? 'text-green-600' :
                status.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {status.status === 'operational' ? '✅' :
                 status.status === 'degraded' ? '⚠️' : '❌'}
              </div>
              <div className={`text-sm font-medium ${
                status.status === 'operational' ? 'text-green-700' :
                status.status === 'degraded' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </div>
              <div className={`text-xs ${
                status.status === 'operational' ? 'text-green-600' :
                status.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {status.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-600 text-2xl mb-2">🚀</div>
            <div className="text-sm font-medium text-blue-700">Response Time</div>
            <div className="text-xs text-blue-600">&lt; 200ms</div>
          </div>
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-600 text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-green-700">Uptime</div>
            <div className="text-xs text-green-600">99.9%</div>
          </div>
          <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-purple-600 text-2xl mb-2">👥</div>
            <div className="text-sm font-medium text-purple-700">Active Sessions</div>
            <div className="text-xs text-purple-600">{stats.activeUsers}</div>
          </div>
          <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-orange-600 text-2xl mb-2">💾</div>
            <div className="text-sm font-medium text-orange-700">Memory Usage</div>
            <div className="text-xs text-orange-600">45%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
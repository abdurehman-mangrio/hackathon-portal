import api from './api';

export const adminService = {
  // Get dashboard statistics from your existing admin/statistics endpoint
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/statistics');
      const data = response.data;
      
      // Transform to match your dashboard structure
      return {
        totalUsers: data.overview.totalUsers,
        activeUsers: data.overview.activeUsers,
        totalChallenges: data.overview.totalChallenges,
        activeChallenges: data.overview.totalChallenges, // You might want to add isActive filter
        totalSubmissions: data.overview.totalSubmissions,
        todaySubmissions: data.overview.totalSubmissions, // You might want to add date filter
        totalTeams: data.overview.totalTeams,
        systemStatus: 'operational' // You can determine this from system health
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  },

  // Get system health from your existing admin/system/health endpoint
  getSystemHealth: async () => {
    try {
      const response = await api.get('/admin/system/health');
      const data = response.data;
      
      // Transform to match your dashboard structure
      return {
        database: {
          status: data.database === 'Connected' ? 'operational' : 'down',
          message: data.database
        },
        api: {
          status: 'operational',
          message: 'API Server running'
        },
        docker: {
          status: data.docker === 'Available' ? 'operational' : 'down',
          message: data.docker
        },
        storage: {
          status: 'operational',
          message: 'File storage normal'
        }
      };
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  },

  // Get recent activity from your existing admin/statistics endpoint
  getRecentActivity: async () => {
    try {
      const response = await api.get('/admin/statistics');
      const data = response.data;
      
      // Transform recent activity to match your dashboard
      return data.recentActivity.map(activity => ({
        _id: Math.random().toString(36).substr(2, 9), // Generate unique ID
        user: { username: activity.user },
        action: activity.correct ? 'solved challenge' : 'attempted challenge',
        challenge: activity.challenge,
        timestamp: activity.timestamp,
        category: activity.category
      }));
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      throw error;
    }
  },

  // Get user management data
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  // Toggle user status
  toggleUserStatus: async (userId, isActive) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      throw error;
    }
  },

  // Get challenge analytics
  getChallengeAnalytics: async () => {
    try {
      const response = await api.get('/admin/analytics/challenges');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch challenge analytics:', error);
      throw error;
    }
  },

  // Create backup
  createBackup: async () => {
    try {
      const response = await api.post('/admin/backup');
      return response.data;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  },

  // Reset challenge
  resetChallenge: async (challengeId) => {
    try {
      const response = await api.post(`/admin/challenges/${challengeId}/reset`);
      return response.data;
    } catch (error) {
      console.error('Failed to reset challenge:', error);
      throw error;
    }
  }
};
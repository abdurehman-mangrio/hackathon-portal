import api from './api';

export const analyticsService = {
  // Get comprehensive platform analytics
  getOverview: async (period = '7d') => {
    try {
      const response = await api.get(`/analytics/overview?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics overview:', error);
      throw error;
    }
  },

  // Get user analytics
  getUserAnalytics: async (period = '7d') => {
    try {
      const response = await api.get(`/analytics/users?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      throw error;
    }
  },

  // Get challenge analytics
  getChallengeAnalytics: async (period = '7d') => {
    try {
      const response = await api.get(`/analytics/challenges?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch challenge analytics:', error);
      throw error;
    }
  },

  // Get submission analytics
  getSubmissionAnalytics: async (period = '7d') => {
    try {
      const response = await api.get(`/analytics/submissions?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch submission analytics:', error);
      throw error;
    }
  },

  // Get performance analytics
  getPerformanceAnalytics: async () => {
    try {
      const response = await api.get('/analytics/performance');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch performance analytics:', error);
      throw error;
    }
  },

  // Get recent activity for dashboard
  getRecentActivity: async (limit = 10) => {
    try {
      const response = await api.get(`/analytics/recent-activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      // Fallback to admin statistics if available
      try {
        const adminResponse = await api.get('/admin/statistics');
        return adminResponse.data.recentActivity?.slice(0, limit) || [];
      } catch {
        throw error;
      }
    }
  },

  // Get platform growth data
  getPlatformGrowth: async (period = '7d') => {
    try {
      const response = await api.get(`/analytics/growth?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch platform growth:', error);
      throw error;
    }
  },

  // Export analytics data
  exportAnalytics: async (type = 'overview', format = 'json') => {
    try {
      const response = await api.get(`/analytics/export?type=${type}&format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export analytics:', error);
      throw error;
    }
  }
};
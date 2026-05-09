import api from './api';

export const achievementService = {
  // User achievement methods
  getMyAchievements: async () => {
    const response = await api.get('/achievements/my');
    return response.data.achievements;
  },

  getUserAchievements: async (userId) => {
    const response = await api.get(`/achievements/user/${userId}`);
    return response.data.achievements;
  },

  getLeaderboard: async (type = null, limit = 20) => {
    const params = { limit };
    if (type) params.type = type;
    const response = await api.get('/achievements/leaderboard', { params });
    return response.data;
  },

  getAchievementTypes: async () => {
    const response = await api.get('/achievements/types');
    return response.data;
  },

  getRecentAchievements: async (limit = 50) => {
    const response = await api.get('/achievements/recent', { 
      params: { limit } 
    });
    return response.data;
  },

  checkNewAchievements: async () => {
    const response = await api.post('/achievements/check');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/achievements/stats');
    return response.data;
  },

  // Admin achievement methods
  getAllAchievements: async (filters = {}) => {
    const response = await api.get('/admin/achievements', { 
      params: filters 
    });
    return response.data;
  },

  getAdminStats: async () => {
    const response = await api.get('/admin/achievements/stats');
    return response.data;
  },

  getUsersForAward: async (search = '') => {
    const response = await api.get('/admin/achievements/users', {
      params: { search }
    });
    return response.data;
  },

  getChallengesForAward: async (search = '') => {
    const response = await api.get('/admin/achievements/challenges', {
      params: { search }
    });
    return response.data;
  },

  awardAchievement: async (awardData) => {
    const response = await api.post('/admin/achievements/award', awardData);
    return response.data;
  },

  revokeAchievement: async (achievementId) => {
    const response = await api.delete(`/admin/achievements/${achievementId}/revoke`);
    return response.data;
  },

  bulkAwardAchievements: async (bulkData) => {
    const response = await api.post('/admin/achievements/bulk-award', bulkData);
    return response.data;
  }
};
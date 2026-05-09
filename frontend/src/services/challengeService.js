// src/services/challengeService.js
import api from './api';

export const challengeService = {
  // Get all challenges for user (public challenges)
  getChallenges: async (params = {}) => {
    const response = await api.get('/challenges', { params });
    return response.data.challenges || response.data;
  },

  // Get solved challenges for current user
  getSolvedChallenges: async () => {
    const response = await api.get('/challenges?status=solved');
    return response.data.challenges || response.data;
  },

  // Get all challenges for admin (includes inactive ones)
  getAllChallenges: async (params = {}) => {
    const response = await api.get('/admin/challenges', { params });
    return response.data.challenges || response.data;
  },

  // Get challenge details for admin
  getChallenge: async (id) => {
    const response = await api.get(`/admin/challenges/${id}`);
    return response.data;
  },

  // Create challenge using your admin route
  createChallenge: async (challengeData) => {
    const response = await api.post('/admin/challenges', challengeData);
    return response.data;
  },

  // Update challenge
  updateChallenge: async (id, challengeData) => {
    const response = await api.put(`/admin/challenges/${id}`, challengeData);
    return response.data;
  },

  // Delete challenge
  deleteChallenge: async (id) => {
    const response = await api.delete(`/admin/challenges/${id}`);
    return response.data;
  },

  // Toggle challenge status
  toggleChallengeStatus: async (id, isActive) => {
    const response = await api.patch(`/admin/challenges/${id}/status`, { isActive });
    return response.data;
  },

  // Get challenge analytics
  getChallengeAnalytics: async (id) => {
    const response = await api.get(`/admin/analytics/challenges/${id}`);
    return response.data;
  },

  // Reset challenge (clear submissions)
  resetChallenge: async (id) => {
    const response = await api.post(`/admin/challenges/${id}/reset`);
    return response.data;
  },

  // Get challenge statistics for dashboard
  getChallengeStats: async () => {
    const response = await api.get('/admin/statistics');
    return response.data;
  },

  // Public challenge endpoints (for players)
  getPublicChallenges: async () => {
    const response = await api.get('/challenges');
    return response.data.challenges || response.data;
  },

  getPublicChallenge: async (id) => {
    const response = await api.get(`/challenges/${id}`);
    return response.data;
  },

  submitFlag: async (challengeId, flag) => {
    const response = await api.post(`/challenges/${challengeId}/submit`, { flag });
    return response.data;
  }
};

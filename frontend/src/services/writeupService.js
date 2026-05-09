import api from './api';

export const writeupService = {
  // Get writeups for a challenge
  getWriteupsByChallenge: async (challengeId, params = {}) => {
    try {
      const response = await api.get(`/writeups/challenge/${challengeId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching writeups by challenge:', error);
      throw new Error(`Failed to fetch writeups for challenge: ${error.response?.data?.error || error.message}`);
    }
  },

  // Get single writeup
  getWriteup: async (writeupId) => {
    try {
      const response = await api.get(`/writeups/${writeupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching writeup:', error);
      throw new Error(`Failed to fetch writeup: ${error.response?.data?.error || error.message}`);
    }
  },

  // Create writeup
  createWriteup: async (writeupData) => {
    try {
      const response = await api.post('/writeups', writeupData);
      return response.data;
    } catch (error) {
      console.error('Error creating writeup:', error);
      throw new Error(`Failed to create writeup: ${error.response?.data?.error || error.message}`);
    }
  },

  // Update writeup
  updateWriteup: async (writeupId, writeupData) => {
    try {
      const response = await api.put(`/writeups/${writeupId}`, writeupData);
      return response.data;
    } catch (error) {
      console.error('Error updating writeup:', error);
      throw new Error(`Failed to update writeup: ${error.response?.data?.error || error.message}`);
    }
  },

  // Delete writeup
  deleteWriteup: async (writeupId) => {
    try {
      const response = await api.delete(`/writeups/${writeupId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting writeup:', error);
      throw new Error(`Failed to delete writeup: ${error.response?.data?.error || error.message}`);
    }
  },

  // Vote on writeup
  voteWriteup: async (writeupId, type) => {
    try {
      const response = await api.post(`/writeups/${writeupId}/vote`, { type });
      return response.data;
    } catch (error) {
      console.error('Error voting on writeup:', error);
      throw new Error(`Failed to vote on writeup: ${error.response?.data?.error || error.message}`);
    }
  },

  // Remove vote
  removeVote: async (writeupId) => {
    try {
      const response = await api.delete(`/writeups/${writeupId}/vote`);
      return response.data;
    } catch (error) {
      console.error('Error removing vote:', error);
      throw new Error(`Failed to remove vote: ${error.response?.data?.error || error.message}`);
    }
  },

  // Get user's writeups
  getUserWriteups: async (userId, params = {}) => {
    try {
      // If no userId provided, get current user's writeups
      const endpoint = userId ? `/writeups/user/${userId}` : '/writeups/user/me';
      const response = await api.get(endpoint, { params });
      return response.data.writeups;
    } catch (error) {
      console.error('Error fetching user writeups:', error);
      throw new Error(`Failed to fetch user writeups: ${error.response?.data?.error || error.message}`);
    }
  },

  // Search writeups
  searchWriteups: async (params = {}) => {
    try {
      // Clean up params to only include valid ones
      const cleanParams = {};
      if (params.q) cleanParams.q = params.q;
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;
      if (params.sort) cleanParams.sort = params.sort;
      if (params.category) cleanParams.category = params.category;
      if (params.tags) cleanParams.tags = params.tags;

      console.log('Search params:', cleanParams);
      const response = await api.get('/writeups/search', { params: cleanParams });
      return response.data;
    } catch (error) {
      console.error('Error searching writeups:', error);
      throw new Error(`Failed to search writeups: ${error.response?.data?.error || error.message}`);
    }
  },

  // Get popular writeups
  getPopularWriteups: async (limit = 10) => {
    try {
      const response = await api.get('/writeups/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular writeups:', error);
      throw new Error(`Failed to fetch popular writeups: ${error.response?.data?.error || error.message}`);
    }
  }
};
// src/services/userService.js
import api from './api';

export const userService = {
  // ===== Current User Operations =====
  
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },

  // Get user stats for current user
  getUserStats: async () => {
    const response = await api.get('/users/me/stats');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/users/me/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Deactivate user account
  deactivateAccount: async () => {
    const response = await api.post('/users/me/deactivate');
    return response.data;
  },

  // ===== Admin User Management =====

  // Get all users with filters and pagination
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get all users (simple pagination - legacy support)
  getAllUsers: async (page = 1, limit = 10) => {
    const response = await api.get(`/users?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Change user status
  changeUserStatus: async (userId, status) => {
    const response = await api.patch(`/users/${userId}/status`, { status });
    return response.data;
  },

  // Change user role
  changeUserRole: async (userId, role) => {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
  },

  // Reactivate user account
  reactivateUser: async (userId) => {
    const response = await api.post(`/users/${userId}/reactivate`);
    return response.data;
  },

  // Reset password
  resetPassword: async (userId, newPassword) => {
    const response = await api.post(`/users/${userId}/reset-password`, {
      newPassword
    });
    return response.data;
  },

  // ===== User Statistics & Dashboard =====

  // Get user statistics for admin dashboard
  getUserOverviewStats: async () => {
    const response = await api.get('/users/stats/overview');
    return response.data;
  },

  // ===== Additional User Features =====

  // Get user achievements
  getUserAchievements: async () => {
    const response = await api.get('/users/me/achievements');
    return response.data;
  },

  // Get user submissions
  getUserSubmissions: async (page = 1, limit = 10) => {
    const response = await api.get(`/users/me/submissions?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get user teams
  getUserTeams: async () => {
    const response = await api.get('/users/me/teams');
    return response.data;
  },

  // Get user leaderboard position
  getLeaderboardPosition: async () => {
    const response = await api.get('/users/me/leaderboard');
    return response.data;
  },

  // ===== Utility Methods =====

  // Test connection
  testConnection: async () => {
    const response = await api.get('/users?limit=1');
    return response.data;
  }
};
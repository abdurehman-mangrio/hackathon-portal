import api from './api';

export const backupService = {
  // Get all backups
  getBackups: async () => {
    try {
      const response = await api.get('/admin/backups');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      throw error;
    }
  },

  // Create a new backup
  createBackup: async () => {
    try {
      const response = await api.post('/admin/backups/create');
      return response.data;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  },

  // Restore backup
  restoreBackup: async (backupId) => {
    try {
      const response = await api.post(`/admin/backups/${backupId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  },

  // Download backup
  downloadBackup: async (backupId) => {
    try {
      const response = await api.get(`/admin/backups/${backupId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download backup:', error);
      throw error;
    }
  },

  // Delete backup
  deleteBackup: async (backupId) => {
    try {
      const response = await api.delete(`/admin/backups/${backupId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  },

  // Get backup settings
  getBackupSettings: async () => {
    try {
      const response = await api.get('/admin/backups/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch backup settings:', error);
      throw error;
    }
  },

  // Update backup settings
  updateBackupSettings: async (settings) => {
    try {
      const response = await api.put('/admin/backups/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update backup settings:', error);
      throw error;
    }
  },

  // Create automatic backup
  createAutoBackup: async () => {
    try {
      const response = await api.post('/admin/backups/auto');
      return response.data;
    } catch (error) {
      console.error('Failed to create automatic backup:', error);
      throw error;
    }
  }
};
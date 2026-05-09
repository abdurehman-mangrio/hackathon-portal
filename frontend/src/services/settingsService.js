import api from './api';

export const settingsService = {
  // Get all system settings
  getSettings: async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
      throw error;
    }
  },

  // Update system settings
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/admin/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw error;
    }
  },

  // Reset settings to default
  resetSettings: async () => {
    try {
      const response = await api.post('/admin/settings/reset');
      return response.data;
    } catch (error) {
      console.error('Failed to reset system settings:', error);
      throw error;
    }
  },

  // Get specific settings section
  getSettingsSection: async (section) => {
    try {
      const response = await api.get(`/admin/settings/${section}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${section} settings:`, error);
      throw error;
    }
  },

  // Test email configuration
  testEmail: async (email) => {
    try {
      const response = await api.post('/admin/settings/test-email', { email });
      return response.data;
    } catch (error) {
      console.error('Failed to test email configuration:', error);
      throw error;
    }
  },

  // Export settings as JSON
  exportSettings: async () => {
    try {
      const response = await api.get('/admin/settings/export/json', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }
};
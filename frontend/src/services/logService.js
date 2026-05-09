import api from './api';

export const logService = {
  getLogs: async (filters = {}) => {
    try {
      const response = await api.get('/admin/logs', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error);
      
      // If the endpoint doesn't exist, you might want to create it
      // For now, return empty array and log the error
      if (error.response?.status === 404) {
        console.warn('Logs endpoint not found. Please implement the backend API.');
      }
      
      throw error;
    }
  },

  getLogStats: async () => {
    try {
      const response = await api.get('/admin/logs/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching log stats:', error);
      
      // Fallback if stats endpoint doesn't exist
      if (error.response?.status === 404) {
        console.warn('Log stats endpoint not found. Using client-side calculation.');
        // You can implement client-side stats calculation here
        return {
          totalCount: 0,
          errorCount: 0,
          warnCount: 0,
          infoCount: 0,
          debugCount: 0
        };
      }
      
      throw error;
    }
  },

  clearLogs: async () => {
    try {
      const response = await api.delete('/admin/logs');
      return response.data;
    } catch (error) {
      console.error('Error clearing logs:', error);
      throw error;
    }
  },

  exportLogs: async () => {
    try {
      const response = await api.get('/admin/logs/export', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  },

  getRealTimeLogs: async (callback) => {
    return new Promise((resolve, reject) => {
      try {
        // Use environment variable or fallback to current host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = process.env.REACT_APP_WS_URL || `${protocol}//${window.location.host}`;
        const ws = new WebSocket(`${wsUrl}/ws/logs`);
        
        ws.onopen = () => {
          console.log('WebSocket connection established for real-time logs');
          // Return cleanup function
          resolve(() => {
            ws.close();
          });
        };

        ws.onmessage = (event) => {
          try {
            const log = JSON.parse(event.data);
            callback(log);
          } catch (parseError) {
            console.error('Error parsing log message:', parseError);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
        };

      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        reject(error);
      }
    });
  }
};
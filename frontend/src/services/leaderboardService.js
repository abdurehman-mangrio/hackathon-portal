import api from './api';

const leaderboardService = {
  getLeaderboard: async (timeRange = 'all') => {
    const response = await api.get(`/leaderboard?timeRange=${timeRange}`);
    return response.data;
  },

  getUserRank: async () => {
    const response = await api.get('/leaderboard/rank');
    return response.data;
  }
};

export default leaderboardService;

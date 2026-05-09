import api from './api.js';

export const teamService = {
  // Get all teams with pagination and search
  getAllTeams: async (params = {}) => {
    const { search = '', page = 1, limit = 20 } = params;
    const response = await api.get('/teams', {
      params: { search, page, limit }
    });
    return response.data;
  },

  // Get single team details
  getTeam: async (teamId) => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },

  // Create new team
  createTeam: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  // Update team
  updateTeam: async (teamId, teamData) => {
    const response = await api.put(`/teams/${teamId}`, teamData);
    return response.data;
  },

  // Disband team
  deleteTeam: async (teamId) => {
    const response = await api.delete(`/teams/${teamId}`);
    return response.data;
  },

  // Join team
  joinTeam: async (teamId) => {
    const response = await api.post(`/teams/${teamId}/join`);
    return response.data;
  },

  // Leave team
  leaveTeam: async (teamId) => {
    const response = await api.post(`/teams/${teamId}/leave`);
    return response.data;
  },

  // Transfer captaincy
  transferCaptaincy: async (teamId, newCaptainId) => {
    const response = await api.post(`/teams/${teamId}/transfer`, {
      newCaptainId
    });
    return response.data;
  },

  // Get team members
  getTeamMembers: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },

  // Get user's current team
  getUserTeam: async () => {
    try {
      // First get user profile to check if they have a team
      const userResponse = await api.get('/users/me');
      const userData = userResponse.data;
      
      if (userData.team) {
        // User has a team, fetch team details
        const teamResponse = await api.get(`/teams/${userData.team}`);
        return teamResponse.data;
      }
      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get team statistics
  getTeamStats: async (teamId) => {
    const response = await api.get(`/teams/${teamId}`);
    const team = response.data.team;
    
    // Calculate stats from team data
    return {
      totalPoints: team.score || 0,
      solvedChallenges: team.solvedChallenges?.length || 0,
      totalMembers: team.members?.length || 0,
      averageScore: team.statistics?.averageScore || 0
    };
  }
};
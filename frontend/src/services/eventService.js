import api from './api.js';

export const eventService = {
  // Get user events (events user is registered for)
  getUserEvents: async () => {
    const response = await api.get('/events?status=active');
    return response.data.events;
  },

  // Get all events (public endpoint)
  getEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data.events;
  },

  // Get single event details
  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Register for event
  registerForEvent: async (eventId, teamId = null) => {
    const response = await api.post(`/events/${eventId}/register`, { teamId });
    return response.data;
  },

  // Unregister from event
  unregisterFromEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/unregister`);
    return response.data;
  },

  // Join event (alias for register)
  joinEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  },

  // Leave event (alias for unregister)
  leaveEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/unregister`);
    return response.data;
  },

  // Get event leaderboard
  getEventLeaderboard: async (eventId) => {
    const response = await api.get(`/events/${eventId}/leaderboard`);
    return response.data;
  },

  // Admin: Create event
  createEvent: async (eventData) => {
    const response = await api.post('/events/admin', eventData);
    return response.data;
  },

  // Admin: Update event
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/admin/${id}`, eventData);
    return response.data;
  },

  // Admin: Delete event
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/admin/${id}`);
    return response.data;
  },

  // Admin: Toggle event status
  toggleEventStatus: async (eventId, isActive) => {
    const response = await api.patch(`/events/admin/${eventId}/status`, { isActive });
    return response.data;
  },

  // Admin: Add challenges to event
  addChallengesToEvent: async (eventId, challengeIds) => {
    const response = await api.post(`/events/admin/${eventId}/challenges`, { challengeIds });
    return response.data;
  },

  // Admin: Remove challenge from event
  removeChallengeFromEvent: async (eventId, challengeId) => {
    const response = await api.delete(`/events/admin/${eventId}/challenges/${challengeId}`);
    return response.data;
  },

  // Admin: Get event statistics
  getEventStatistics: async (eventId) => {
    const response = await api.get(`/events/admin/${eventId}/statistics`);
    return response.data;
  },

  // Admin: Get all events with admin privileges
  getAdminEvents: async (params = {}) => {
    const response = await api.get('/events/admin/events', { params });
    return response.data;
  }
};

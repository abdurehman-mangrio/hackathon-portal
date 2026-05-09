import React, { useState, useEffect, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { challengeService } from '../../services/challengeService';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [managingChallenges, setManagingChallenges] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  // Fetch events with proper error handling
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try admin endpoint first, fallback to public endpoint
      let data;
      try {
        data = await eventService.getAdminEvents();
      } catch (adminError) {
        console.log('Admin events endpoint not available, using public endpoint');
        data = await eventService.getEvents();
      }

      // Handle different response formats
      let eventsArray = [];

      if (Array.isArray(data)) {
        eventsArray = data;
      } else if (data && Array.isArray(data.events)) {
        eventsArray = data.events;
      } else if (data && Array.isArray(data.data)) {
        eventsArray = data.data;
      } else {
        eventsArray = [];
      }

      setEvents(eventsArray);
      calculateStats(eventsArray);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available challenges for event management
  const fetchChallenges = useCallback(async () => {
    try {
      const data = await challengeService.getAllChallenges();
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      // Continue without challenges - they can be added later
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchChallenges();
  }, [fetchEvents, fetchChallenges]);

  // Filter events with memoization
  useEffect(() => {
    const filterEvents = () => {
      const eventsArray = Array.isArray(events) ? events : [];
      let filtered = [...eventsArray];

      // Filter by status
      if (filters.status !== 'all') {
        const now = new Date();
        filtered = filtered.filter(event => {
          if (!event?.startTime || !event?.endTime) return false;

          try {
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);

            switch (filters.status) {
              case 'upcoming':
                return startTime > now;
              case 'active':
                return startTime <= now && endTime >= now && event.isActive;
              case 'past':
                return endTime < now;
              case 'inactive':
                return !event.isActive;
              default:
                return true;
            }
          } catch (dateError) {
            console.error('Invalid date format:', event);
            return false;
          }
        });
      }

      // Filter by search
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        filtered = filtered.filter(event =>
          event?.name?.toLowerCase().includes(searchTerm) ||
          event?.description?.toLowerCase().includes(searchTerm)
        );
      }

      setFilteredEvents(filtered);
    };

    filterEvents();
  }, [events, filters]);

  // Calculate event statistics
  const calculateStats = (eventsArray) => {
    const now = new Date();
    const stats = {
      total: eventsArray.length,
      upcoming: 0,
      active: 0,
      past: 0,
      inactive: 0,
      totalParticipants: 0,
      totalChallenges: 0
    };

    eventsArray.forEach(event => {
      if (!event?.startTime || !event?.endTime) return;

      try {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);

        if (startTime > now) {
          stats.upcoming++;
        } else if (startTime <= now && endTime >= now && event.isActive) {
          stats.active++;
        } else if (endTime < now) {
          stats.past++;
        }

        if (!event.isActive) {
          stats.inactive++;
        }

        // Count participants
        if (event.participants && Array.isArray(event.participants)) {
          stats.totalParticipants += event.participants.length;
        }

        // Count challenges
        if (event.challenges && Array.isArray(event.challenges)) {
          stats.totalChallenges += event.challenges.length;
        }
      } catch {
        // Skip events with invalid dates
      }
    });

    setStats(stats);
  };

  // Event operations
  const handleCreateEvent = async (eventData) => {
    try {
      setError(null);
      await eventService.createEvent(eventData);
      setShowCreateForm(false);
      await fetchEvents();
    } catch (err) {
      console.error('Error creating event:', err);
      throw new Error(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      setError(null);
      await eventService.updateEvent(eventId, eventData);
      setEditingEvent(null);
      await fetchEvents();
    } catch (err) {
      console.error('Error updating event:', err);
      throw new Error(err.response?.data?.error || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await eventService.deleteEvent(eventId);
      await fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleEventStatus = async (eventId, currentStatus) => {
    try {
      setError(null);
      const newStatus = !currentStatus;
      await eventService.toggleEventStatus(eventId, newStatus);
      await fetchEvents();
    } catch (err) {
      console.error('Error toggling event status:', err);
      setError('Failed to update event status: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddChallenges = async (eventId, challengeIds) => {
    try {
      setError(null);
      await eventService.addChallengesToEvent(eventId, challengeIds);
      setManagingChallenges(null);
      await fetchEvents();
    } catch (err) {
      console.error('Error adding challenges:', err);
      throw new Error(err.response?.data?.error || 'Failed to add challenges');
    }
  };

  const handleRemoveChallenge = async (eventId, challengeId) => {
    try {
      setError(null);
      await eventService.removeChallengeFromEvent(eventId, challengeId);
      await fetchEvents();
    } catch (err) {
      console.error('Error removing challenge:', err);
      setError('Failed to remove challenge: ' + (err.response?.data?.error || err.message));
    }
  };

  const getEventStatus = (event) => {
    if (!event?.startTime || !event?.endTime) return 'unknown';

    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (!event.isActive) return 'inactive';
    if (startTime > now) return 'upcoming';
    if (startTime <= now && endTime >= now) return 'active';
    if (endTime < now) return 'past';

    return 'unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'past': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'upcoming': return '🔵';
      case 'past': return '⚫';
      case 'inactive': return '🔴';
      default: return '❓';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getTimeRemaining = (startTime, endTime) => {
    if (!startTime || !endTime) return null;

    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      const diff = start - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `Starts in ${days}d ${hours}h`;
    } else if (now <= end) {
      const diff = end - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `Ends in ${days}d ${hours}h`;
    } else {
      return 'Event ended';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 p-6 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="bg-gray-200 p-6 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
          <p className="text-gray-600">Create and manage CTF events and competitions</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="mt-4 lg:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Event</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Event Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          value={stats.total}
          label="Total Events"
          color="blue"
          icon="📊"
        />
        <StatCard
          value={stats.active}
          label="Active"
          color="green"
          icon="🟢"
        />
        <StatCard
          value={stats.upcoming}
          label="Upcoming"
          color="blue"
          icon="🔵"
        />
        <StatCard
          value={stats.totalParticipants}
          label="Total Participants"
          color="purple"
          icon="👥"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Events
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by event name or description..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Events
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Event</span>
              </button>
              <button
                onClick={fetchEvents}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium border border-gray-200 hover:border-gray-300 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Event Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Challenges
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => {
                const status = getEventStatus(event);
                return (
                  <tr
                    key={event._id}
                    className="hover:bg-gray-50 transition-colors duration-150 group border-l-4 border-l-transparent hover:border-l-blue-500"
                  >
                    {/* Event Details */}
                    <td className="px-6 py-5">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {event.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Created {formatDate(event.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center text-sm text-gray-900">
                          <span className="w-12 text-gray-500 text-xs font-medium">Start:</span>
                          <span>{formatDate(event.startTime)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                          <span className="w-12 text-gray-500 text-xs font-medium">End:</span>
                          <span>{formatDate(event.endTime)}</span>
                        </div>
                        <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block mt-2">
                          {getTimeRemaining(event.startTime, event.endTime)}
                        </div>
                      </div>
                    </td>

                    {/* Participants */}
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-green-700">
                            {event.participants?.length || 0}
                          </span>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{event.participants?.length || 0}</div>
                          {event.maxTeamSize && (
                            <div className="text-xs text-gray-500">Max {event.maxTeamSize}/team</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Challenges */}
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-purple-700">
                            {event.challenges?.length || 0}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {event.challenges?.length || 0}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="ml-1.5">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </span>
                        {!event.isPublic && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Private
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group relative"
                          title="Edit Event"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            Edit Event
                          </span>
                        </button>

                        <button
                          onClick={() => setManagingChallenges(event)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 group relative"
                          title="Manage Challenges"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            Challenges
                          </span>
                        </button>

                        <button
                          onClick={() => handleToggleEventStatus(event._id, event.isActive)}
                          className={`p-2 rounded-lg transition-all duration-200 group relative ${event.isActive
                              ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                          title={event.isActive ? 'Deactivate Event' : 'Activate Event'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {event.isActive ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            )}
                          </svg>
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {event.isActive ? 'Deactivate' : 'Activate'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group relative"
                          title="Delete Event"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            Delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-16 px-6">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {events.length === 0 ? 'No events created yet' : 'No events found'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {events.length === 0
                    ? 'Get started by creating your first event to organize challenges and participants.'
                    : 'Try adjusting your filters to see more results.'
                  }
                </p>
                {events.length === 0 && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Your First Event</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Create/Edit Event Form */}
      {(showCreateForm || editingEvent) && (
        <EventForm
          event={editingEvent}
          onSubmit={editingEvent ?
            (data) => handleUpdateEvent(editingEvent._id, data) :
            handleCreateEvent
          }
          onCancel={() => {
            setShowCreateForm(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* Manage Challenges Modal */}
      {managingChallenges && (
        <ManageChallengesModal
          event={managingChallenges}
          challenges={challenges}
          onAddChallenges={handleAddChallenges}
          onRemoveChallenge={handleRemoveChallenge}
          onClose={() => setManagingChallenges(null)}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ value, label, color, icon }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl mt-2">{icon}</div>
    </div>
  );
};

// Event Form Component
const EventForm = ({ event, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    startTime: event?.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
    endTime: event?.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
    maxTeamSize: event?.maxTeamSize || 4,
    isPublic: event?.isPublic ?? true,
    isActive: event?.isActive ?? false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      // Convert datetime-local format to ISO string
      const submitData = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString()
      };

      await onSubmit(submitData);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>

          {formError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{formError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Team Size
                </label>
                <input
                  type="number"
                  name="maxTeamSize"
                  value={formData.maxTeamSize}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Public Event</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Visible to all users</p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Event is currently running</p>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {event ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  event ? 'Update Event' : 'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Manage Challenges Modal Component
const ManageChallengesModal = ({ event, challenges, onAddChallenges, onRemoveChallenge, onClose }) => {
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentEventChallenges = event.challenges || [];

  const availableChallenges = challenges.filter(
    challenge => !currentEventChallenges.some(ec => ec._id === challenge._id)
  );

  const handleAddChallenges = async () => {
    if (selectedChallenges.length === 0) return;

    try {
      setIsSubmitting(true);
      setError('');
      await onAddChallenges(event._id, selectedChallenges);
      setSelectedChallenges([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveChallenge = async (challengeId) => {
    try {
      setError('');
      await onRemoveChallenge(event._id, challengeId);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Challenges: {event.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Challenges */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Challenges ({availableChallenges.length})
              </h3>

              {availableChallenges.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableChallenges.map(challenge => (
                    <div
                      key={challenge._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{challenge.name}</div>
                        <div className="text-sm text-gray-500">{challenge.category}</div>
                      </div>
                      <button
                        onClick={() => setSelectedChallenges(prev =>
                          prev.includes(challenge._id)
                            ? prev.filter(id => id !== challenge._id)
                            : [...prev, challenge._id]
                        )}
                        className={`px-3 py-1 rounded text-sm font-medium ${selectedChallenges.includes(challenge._id)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {selectedChallenges.includes(challenge._id) ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No available challenges to add
                </div>
              )}

              {availableChallenges.length > 0 && (
                <button
                  onClick={handleAddChallenges}
                  disabled={selectedChallenges.length === 0 || isSubmitting}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
                >
                  {isSubmitting ? 'Adding...' : `Add Selected (${selectedChallenges.length})`}
                </button>
              )}
            </div>

            {/* Current Event Challenges */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Event Challenges ({currentEventChallenges.length})
              </h3>

              {currentEventChallenges.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentEventChallenges.map(challenge => (
                    <div
                      key={challenge._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{challenge.name}</div>
                        <div className="text-sm text-gray-500">{challenge.category}</div>
                        <div className="text-xs text-gray-400">Points: {challenge.points}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveChallenge(challenge._id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove from event"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No challenges added to this event yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagement; 
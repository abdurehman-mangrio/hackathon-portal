// src/pages/user/Events.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../contexts/AuthContext';

const UserEvents = () => {
  const [events, setEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const [filters, setFilters] = useState({
    status: 'upcoming',
    search: '',
    sortBy: 'startDate',
    sortOrder: 'asc'
  });

  // Fetch events data
  const fetchEventsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsData, userEventsData] = await Promise.all([
        eventService.getEvents(),
        eventService.getUserEvents()
      ]);

      setEvents(eventsData);
      setUserEvents(userEventsData);
    } catch (err) {
      console.error('Error fetching events data:', err);
      setError(err.message || 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEventsData();
  }, [fetchEventsData]);

  // Event actions
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleJoinEvent = async (eventId) => {
    try {
      setActionLoading(true);
      await eventService.joinEvent(eventId);
      await fetchEventsData();
    } catch (err) {
      console.error('Error joining event:', err);
      setError(err.message || 'Failed to join event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveEvent = async (eventId) => {
    try {
      setActionLoading(true);
      await eventService.leaveEvent(eventId);
      await fetchEventsData();
    } catch (err) {
      console.error('Error leaving event:', err);
      setError(err.message || 'Failed to leave event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    // Status filter
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (filters.status === 'upcoming' && startDate <= now) return false;
    if (filters.status === 'ongoing' && (startDate > now || endDate < now)) return false;
    if (filters.status === 'past' && endDate >= now) return false;
    if (filters.status === 'registered' && !userEvents.find(ue => ue.eventId === event._id)) return false;

    // Search filter
    if (filters.search && !event.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const aValue = a[filters.sortBy] || '';
    const bValue = b[filters.sortBy] || '';
    
    if (filters.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  // Check if user is registered for an event
  const isUserRegistered = (eventId) => {
    return userEvents.some(ue => ue.eventId === eventId);
  };

  // Get event status
  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'past';
  };

  // Stats
  const getEventStats = () => {
    const total = events.length;
    const upcoming = events.filter(e => getEventStatus(e) === 'upcoming').length;
    const ongoing = events.filter(e => getEventStatus(e) === 'ongoing').length;
    const registered = userEvents.length;

    return { total, upcoming, ongoing, registered };
  };

  const stats = getEventStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading events...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CTF Events</h1>
            <p className="text-gray-600 mt-2">
              Participate in competitive CTF events and challenges
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchEventsData}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard value={stats.total} label="Total Events" color="blue" />
          <StatCard value={stats.upcoming} label="Upcoming" color="purple" />
          <StatCard value={stats.ongoing} label="Ongoing" color="green" />
          <StatCard value={stats.registered} label="Registered" color="orange" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past Events</option>
                <option value="registered">My Events</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search events..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="startDate">Start Date</option>
                <option value="name">Event Name</option>
                <option value="difficulty">Difficulty</option>
                <option value="participants">Participants</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              isRegistered={isUserRegistered(event._id)}
              onView={handleViewEvent}
              onJoin={handleJoinEvent}
              onLeave={handleLeaveEvent}
              actionLoading={actionLoading}
              getEventStatus={getEventStatus}
            />
          ))}
        </div>

        {/* Empty State */}
        {sortedEvents.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.status !== 'upcoming'
                ? 'No events match your current filters.'
                : 'No events are scheduled at the moment.'
              }
            </p>
            {(filters.search || filters.status !== 'upcoming') && (
              <button
                onClick={() => setFilters({ 
                  status: 'upcoming', 
                  search: '', 
                  sortBy: 'startDate', 
                  sortOrder: 'asc' 
                })}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Show Upcoming Events
              </button>
            )}
          </div>
        )}

        {/* Event Modal */}
        {showEventModal && (
          <EventModal
            event={selectedEvent}
            isRegistered={isUserRegistered(selectedEvent?._id)}
            onClose={() => {
              setShowEventModal(false);
              setSelectedEvent(null);
            }}
            onJoin={handleJoinEvent}
            onLeave={handleLeaveEvent}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

// Event Card Component
const EventCard = ({ event, isRegistered, onView, onJoin, onLeave, actionLoading, getEventStatus }) => {
  const status = getEventStatus(event);
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'past': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return '⏰';
      case 'ongoing': return '🔥';
      case 'past': return '✅';
      default: return '📅';
    }
  };

  const formatDateRange = (start, end) => {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const getTimeUntilStart = (startDate) => {
    const now = new Date();
    const diff = startDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Starting soon';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {getStatusIcon(status)} {status}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">{event.description}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Duration:</span>
          <span className="text-gray-900">{formatDateRange(startDate, endDate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Format:</span>
          <span className="text-gray-900">{event.format || 'Jeopardy'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Difficulty:</span>
          <span className="text-gray-900 capitalize">{event.difficulty || 'Mixed'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Participants:</span>
          <span className="text-gray-900">{event.participants || 0}</span>
        </div>
      </div>

      {status === 'upcoming' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="text-blue-700 text-sm font-medium">
            {getTimeUntilStart(startDate)}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => onView(event)}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm"
        >
          View Details
        </button>
        
        {status !== 'past' && (
          isRegistered ? (
            <button
              onClick={() => onLeave(event._id)}
              disabled={actionLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm disabled:opacity-50"
            >
              {actionLoading ? '...' : 'Leave'}
            </button>
          ) : (
            <button
              onClick={() => onJoin(event._id)}
              disabled={actionLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm disabled:opacity-50"
            >
              {actionLoading ? '...' : 'Join'}
            </button>
          )
        )}
      </div>
    </div>
  );
};

// Event Modal Component
const EventModal = ({ event, isRegistered, onClose, onJoin, onLeave, actionLoading }) => {
  if (!event) return null;

  const status = new Date(event.startDate) > new Date() ? 'upcoming' : 
                 new Date() <= new Date(event.endDate) ? 'ongoing' : 'past';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Details */}
            <div className="lg:col-span-2">
              <div className="prose max-w-none mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>

              {/* Event Rules */}
              {event.rules && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Rules & Guidelines</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                      {event.rules.split('\n').map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Challenges */}
              {event.challenges && event.challenges.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Challenges</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {event.challenges.map((challenge, index) => (
                      <div key={challenge._id || index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div>
                          <div className="font-medium text-gray-900">{challenge.title}</div>
                          <div className="text-sm text-gray-600">{challenge.category} • {challenge.points} points</div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {challenge.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start:</span>
                    <span className="text-gray-900">{new Date(event.startDate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End:</span>
                    <span className="text-gray-900">{new Date(event.endDate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="text-gray-900">{event.format || 'Jeopardy'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="text-gray-900 capitalize">{event.difficulty || 'Mixed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants:</span>
                    <span className="text-gray-900">{event.participants || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Size:</span>
                    <span className="text-gray-900">{event.teamSize || 'Individual'}</span>
                  </div>
                </div>
              </div>

              {/* Registration */}
              {status !== 'past' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Registration</h3>
                  {isRegistered ? (
                    <div className="space-y-3">
                      <div className="text-green-600 font-medium">✅ You are registered</div>
                      <button
                        onClick={() => onLeave(event._id)}
                        disabled={actionLoading}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                      >
                        {actionLoading ? 'Leaving...' : 'Leave Event'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={() => onJoin(event._id)}
                        disabled={actionLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                      >
                        {actionLoading ? 'Joining...' : 'Join Event'}
                      </button>
                      <p className="text-blue-700 text-sm">
                        Join this event to participate in challenges and compete with other players.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Prizes */}
              {event.prizes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">Prizes</h3>
                  <div className="space-y-2 text-sm text-yellow-700">
                    {event.prizes.split('\n').map((prize, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span>🏆</span>
                        <span>{prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEvents;
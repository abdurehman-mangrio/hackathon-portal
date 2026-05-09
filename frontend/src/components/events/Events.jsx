import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import EventCard from '../../components/events/EventCard';
import EventTimer from '../../components/events/EventTimer';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, ongoing, past
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await eventService.registerForEvent(eventId);
      fetchEvents(); // Refresh events to update registration status
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const handleViewDetails = (eventId) => {
    const event = events.find(e => e._id === eventId);
    setSelectedEvent(event);
  };

  const filteredEvents = events.filter(event => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    switch (filter) {
      case 'upcoming':
        return startDate > now;
      case 'ongoing':
        return startDate <= now && endDate >= now;
      case 'past':
        return endDate < now;
      default:
        return true;
    }
  });

  const upcomingEvents = events.filter(event => new Date(event.startDate) > new Date());
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          CTF Events
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Participate in exciting Capture The Flag events. Test your skills, compete with others, and win prizes!
        </p>
      </div>

      {/* Next Event Countdown */}
      {nextEvent && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Next Event
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <EventCard
                event={nextEvent}
                onRegister={handleRegister}
                onView={handleViewDetails}
              />
            </div>
            <div className="lg:col-span-1">
              <EventTimer
                startDate={nextEvent.startDate}
                endDate={nextEvent.endDate}
                onEventStart={fetchEvents}
                onEventEnd={fetchEvents}
              />
            </div>
          </div>
        </div>
      )}

      {/* Events Filter and List */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            All Events
          </h2>
          
          <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['all', 'upcoming', 'ongoing', 'past'].map((filterType) => (
              <button
                key={filterType}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  filter === filterType
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                onClick={() => setFilter(filterType)}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard
                key={event._id}
                event={event}
                onRegister={handleRegister}
                onView={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏁</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              There are no {filter} events at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedEvent.name}
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedEvent.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedEvent.startDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">End Date</label>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedEvent.endDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Participants</label>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedEvent.participantsCount}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Prize Pool</label>
                    <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                      ${selectedEvent.prizePool}
                    </p>
                  </div>
                </div>

                {selectedEvent.rules && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Rules</h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      {selectedEvent.rules.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
                {new Date(selectedEvent.startDate) > new Date() && !selectedEvent.isRegistered && (
                  <button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
                    onClick={() => handleRegister(selectedEvent._id)}
                  >
                    Register Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
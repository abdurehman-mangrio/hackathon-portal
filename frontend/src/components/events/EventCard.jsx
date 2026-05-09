import React from 'react';

const EventCard = ({ event, onRegister, onView }) => {
  const isUpcoming = new Date(event.startDate) > new Date();
  const isOngoing = new Date() >= new Date(event.startDate) && new Date() <= new Date(event.endDate);
  const isPast = new Date(event.endDate) < new Date();

  const getStatusBadge = () => {
    if (isUpcoming) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    if (isOngoing) return { label: 'Live', color: 'bg-green-100 text-green-800' };
    return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
  };

  const status = getStatusBadge();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
          {event.name}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {event.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
        </div>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {event.participantsCount} participants
        </div>

        {event.prizePool > 0 && (
          <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Prize Pool: ${event.prizePool}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button 
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
          onClick={() => onView(event._id)}
        >
          View Details
        </button>
        
        {isUpcoming && !event.isRegistered && (
          <button 
            className="flex-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
            onClick={() => onRegister(event._id)}
          >
            Register
          </button>
        )}
        
        {event.isRegistered && (
          <span className="flex-1 bg-green-100 text-green-800 py-2 px-4 rounded-lg text-sm font-medium text-center">
            Registered
          </span>
        )}
      </div>
    </div>
  );
};

export default EventCard;
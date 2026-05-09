import React, { useState, useEffect } from 'react';

const SessionMonitor = ({ onTimeout, timeoutDuration = 30 * 60 * 1000 }) => { // 30 minutes default
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(timeoutDuration);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const activities = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    activities.forEach(activity => {
      document.addEventListener(activity, updateActivity);
    });

    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, updateActivity);
      });
    };
  }, []);

  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const remainingTime = timeoutDuration - timeSinceLastActivity;

      setTimeLeft(Math.max(0, remainingTime));

      if (timeSinceLastActivity >= timeoutDuration) {
        // Session timeout
        onTimeout?.();
        clearInterval(checkInactivity);
      } else if (timeSinceLastActivity >= timeoutDuration - 60000) {
        // Show warning 1 minute before timeout
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [lastActivity, timeoutDuration, onTimeout]);

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const extendSession = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Session About to Expire
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your session will expire in {formatTime(timeLeft)} due to inactivity.
          </p>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
              style={{ 
                width: `${(timeLeft / 60000) * 100 / (timeoutDuration / 60000)}%` 
              }}
            ></div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={extendSession}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
            >
              Continue Session
            </button>
            <button
              onClick={onTimeout}
              className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionMonitor;
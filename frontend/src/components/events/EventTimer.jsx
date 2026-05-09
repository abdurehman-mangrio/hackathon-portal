import React, { useState, useEffect } from 'react';

const EventTimer = ({ startDate, endDate, onEventStart, onEventEnd }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [eventStatus, setEventStatus] = useState('upcoming'); // upcoming, ongoing, ended

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      if (now < start) {
        setEventStatus('upcoming');
        const difference = start - now;
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
      } else if (now >= start && now <= end) {
        setEventStatus('ongoing');
        const difference = end - now;
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
      } else {
        setEventStatus('ended');
        return {};
      }
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Call callbacks when event starts or ends
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      if (now >= start && now - 1000 < start) {
        onEventStart?.();
      }
      if (now >= end && now - 1000 < end) {
        onEventEnd?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate, endDate, onEventStart, onEventEnd]);

  const getStatusConfig = () => {
    switch (eventStatus) {
      case 'upcoming':
        return {
          title: 'Starts In',
          gradient: 'from-blue-500 to-purple-600',
          textColor: 'text-white'
        };
      case 'ongoing':
        return {
          title: 'Ends In',
          gradient: 'from-green-500 to-emerald-600',
          textColor: 'text-white'
        };
      case 'ended':
        return {
          title: 'Event Ended',
          gradient: 'from-gray-500 to-gray-600',
          textColor: 'text-white'
        };
      default:
        return {
          title: 'Event',
          gradient: 'from-gray-500 to-gray-600',
          textColor: 'text-white'
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (eventStatus === 'ended') {
    return (
      <div className={`bg-gradient-to-r ${statusConfig.gradient} rounded-xl p-6 text-center shadow-lg`}>
        <h3 className={`text-xl font-bold ${statusConfig.textColor} mb-2`}>
          {statusConfig.title}
        </h3>
        <p className={`text-lg ${statusConfig.textColor} opacity-90`}>
          Thank you for participating!
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r ${statusConfig.gradient} rounded-xl p-6 shadow-lg`}>
      <h3 className={`text-xl font-bold ${statusConfig.textColor} text-center mb-4`}>
        {statusConfig.title}
      </h3>
      
      <div className="grid grid-cols-4 gap-3 text-center">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
            <div className={`text-2xl font-bold ${statusConfig.textColor}`}>
              {value.toString().padStart(2, '0')}
            </div>
            <div className={`text-sm ${statusConfig.textColor} opacity-90 uppercase tracking-wide`}>
              {unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventTimer;
import React from 'react';

const TeamCard = ({ team, onJoin, onView }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{team.name}</h3>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          {team.score} pts
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {team.description}
      </p>

      <div className="flex gap-3">
        <button 
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
          onClick={() => onView(team._id)}
        >
          View Team
        </button>
        <button 
          className="flex-1 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
          onClick={() => onJoin(team._id)}
        >
          Join Team
        </button>
      </div>
    </div>
  );
};

export default TeamCard;
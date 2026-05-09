import React from 'react';

const TeamCard = ({ team, onJoin, onView }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 hover:-translate-y-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{team.name}</h3>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          {team.score} pts
        </span>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {team.memberCount} / {team.maxMembers} members
        </span>
        <div className="flex items-center">
          {team.members?.slice(0, 3).map((member, index) => (
            <img
              key={index}
              src={member.avatar}
              alt={member.username}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 -ml-2 first:ml-0"
              title={member.username}
            />
          ))}
          {team.memberCount > 3 && (
            <span className="w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full border-2 border-white dark:border-gray-800 -ml-2 flex items-center justify-center text-xs">
              +{team.memberCount - 3}
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm leading-relaxed">
        {team.description}
      </p>

      <div className="flex gap-3">
        <button 
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
          onClick={() => onView(team._id)}
        >
          View Team
        </button>
        {!team.isMember && team.memberCount < team.maxMembers && (
          <button 
            className="flex-1 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
            onClick={() => onJoin(team._id)}
          >
            Join Team
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamCard;
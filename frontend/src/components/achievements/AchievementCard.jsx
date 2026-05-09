import React from 'react';

const AchievementCard = ({ achievement, unlocked, progress, showProgress = true }) => {
  const isUnlocked = unlocked || (progress?.current >= progress?.target);
  
  // Get background color based on achievement type
  const getBackgroundColor = () => {
    if (!isUnlocked) return 'bg-gray-100 dark:bg-gray-700';
    
    const typeColors = {
      first_blood: 'bg-red-50 dark:bg-red-900',
      category_master: 'bg-blue-50 dark:bg-blue-900',
      speed_demon: 'bg-yellow-50 dark:bg-yellow-900',
      point_milestone: 'bg-green-50 dark:bg-green-900',
      team_player: 'bg-purple-50 dark:bg-purple-900',
      persistence: 'bg-orange-50 dark:bg-orange-900',
      streak: 'bg-red-50 dark:bg-red-900',
      solver: 'bg-blue-50 dark:bg-blue-900'
    };
    
    return typeColors[achievement.type] || 'bg-gray-50 dark:bg-gray-800';
  };

  return (
    <div className={`rounded-xl p-6 border-2 transition-all duration-300 ${getBackgroundColor()} ${
      isUnlocked 
        ? 'border-yellow-400 shadow-lg hover:scale-105' 
        : 'border-gray-200 dark:border-gray-600 opacity-75'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${
            isUnlocked 
              ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-400' 
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
          }`}>
            <span className="text-2xl">
              {achievement.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${
              isUnlocked 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {achievement.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {achievement.description}
            </p>
            {achievement.challenge && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Challenge: {achievement.challenge.title}
              </p>
            )}
          </div>
        </div>
        
        {isUnlocked ? (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
            Unlocked
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
            Locked
          </span>
        )}
      </div>

      {showProgress && !isUnlocked && progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{progress.current} / {progress.target}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.target) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {achievement.points} pts
        </span>
        <div className="flex items-center space-x-2">
          {achievement.awardedAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(achievement.awardedAt).toLocaleDateString()}
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${
            achievement.rarity === 'common' ? 'bg-green-100 text-green-800' :
            achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
            achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {achievement.rarity || 'common'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;
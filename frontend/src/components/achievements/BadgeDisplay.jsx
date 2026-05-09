import React from 'react';

const BadgeDisplay = ({ badge, size = 'medium', showTooltip = true }) => {
  const sizeClasses = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-xl',
    large: 'w-24 h-24 text-2xl',
    xlarge: 'w-32 h-32 text-3xl'
  };

  return (
    <div className="relative group">
      <div className={`
        rounded-full flex items-center justify-center border-4 shadow-lg transition-transform duration-300 group-hover:scale-110
        ${badge.unlocked 
          ? 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' 
          : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400'
        }
        ${sizeClasses[size]}
      `}>
        {badge.icon}
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded py-1 px-2 whitespace-nowrap">
            <div className="font-semibold">{badge.name}</div>
            <div className="text-gray-300">{badge.description}</div>
            {!badge.unlocked && (
              <div className="text-yellow-300 text-xs mt-1">
                Locked - {badge.requirement}
              </div>
            )}
          </div>
          <div className="w-3 h-3 bg-gray-900 dark:bg-gray-700 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;
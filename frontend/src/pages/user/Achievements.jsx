import React, { useState, useEffect } from 'react';
import { achievementService } from '../../services/achievementService';
import AchievementCard from '../../components/achievements/AchievementCard';

const UserAchievements = () => {
  const [achievements, setAchievements] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState('all');

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await achievementService.getMyAchievements();
      setAchievements(data.achievements || {});
      setStats(data.statistics || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const achievementTypes = {
    first_blood: { name: 'First Blood', icon: '🩸', color: 'red' },
    category_master: { name: 'Category Master', icon: '🎯', color: 'blue' },
    speed_demon: { name: 'Speed Demon', icon: '⚡', color: 'yellow' },
    point_milestone: { name: 'Point Milestone', icon: '💰', color: 'green' },
    team_player: { name: 'Team Player', icon: '👥', color: 'purple' },
    persistence: { name: 'Persistence', icon: '💪', color: 'orange' },
    streak: { name: 'Streak Master', icon: '🔥', color: 'red' },
    solver: { name: 'Solver', icon: '✅', color: 'blue' }
  };

  const getAchievementsToDisplay = () => {
    if (activeType === 'all') {
      return Object.values(achievements).flat();
    }
    return achievements[activeType] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Achievements</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your progress and celebrate your hacking accomplishments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total || 0}</div>
            <div className="text-gray-600">Total Achievements</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {Object.keys(achievements).length}
            </div>
            <div className="text-gray-600">Achievement Types</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {stats.byType ? Object.values(stats.byType).reduce((a, b) => a + b, 0) : 0}
            </div>
            <div className="text-gray-600">Points Earned</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {stats.recent ? stats.recent.length : 0}
            </div>
            <div className="text-gray-600">Recent Unlocks</div>
          </div>
        </div>

        {/* Type Filter */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Type</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveType('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Achievements ({stats.total || 0})
              </button>
              {Object.entries(achievementTypes).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {info.icon} {info.name} ({achievements[type]?.length || 0})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getAchievementsToDisplay().map((achievement) => (
            <AchievementCard
              key={achievement._id}
              achievement={{
                ...achievement,
                name: achievementTypes[achievement.type]?.name || achievement.type,
                icon: achievementTypes[achievement.type]?.icon || '🏆',
                description: achievement.metadata?.description || `Earned for ${achievement.type}`,
                points: achievement.points || 0,
                rarity: achievementTypes[achievement.type]?.color || 'common'
              }}
              unlocked={true}
            />
          ))}
        </div>

        {/* Empty State */}
        {getAchievementsToDisplay().length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {activeType === 'all' ? 'No Achievements Yet' : 'No Achievements of This Type'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {activeType === 'all'
                ? 'Start solving challenges to earn your first achievements!'
                : `Keep working on ${achievementTypes[activeType]?.name?.toLowerCase()} challenges to earn this achievement.`}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-red-800 font-medium">{error}</div>
            <button
              onClick={fetchAchievements}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAchievements;
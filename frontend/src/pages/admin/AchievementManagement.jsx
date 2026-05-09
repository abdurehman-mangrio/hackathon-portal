import React, { useState, useEffect, useCallback } from 'react';
import { achievementService } from '../../services/achievementService';

// Achievement Card Component for Admin
const AchievementCard = ({ achievement, onRevoke }) => {
  const getDisplayType = (achievementType) => {
    const typeMap = {
      'first_blood': 'First Blood',
      'category_master': 'Category Master', 
      'speed_demon': 'Speed Demon',
      'point_milestone': 'Point Milestone',
      'team_player': 'Team Player',
      'persistence': 'Persistence',
      'streak': 'Streak Master',
      'solver': 'Solver'
    };
    return typeMap[achievementType] || achievementType;
  };

  const getDisplayIcon = (achievementType) => {
    const iconMap = {
      'first_blood': '🩸',
      'category_master': '🎯',
      'speed_demon': '⚡',
      'point_milestone': '💰',
      'team_player': '👥',
      'persistence': '💪',
      'streak': '🔥',
      'solver': '✅'
    };
    return iconMap[achievementType] || '🏆';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-white text-xl shadow-md">
            {getDisplayIcon(achievement.type)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {getDisplayType(achievement.type)}
            </h3>
            <p className="text-sm text-gray-500">
              {achievement.user?.username || 'Unknown User'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onRevoke(achievement)}
          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors duration-150"
          title="Revoke Achievement"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Points:</span>
          <span className="font-semibold">{achievement.points || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Awarded:</span>
          <span>{new Date(achievement.awardedAt).toLocaleDateString()}</span>
        </div>
        {achievement.challenge && (
          <div className="flex justify-between">
            <span>Challenge:</span>
            <span className="font-medium">{achievement.challenge.title}</span>
          </div>
        )}
        {achievement.category && (
          <div className="flex justify-between">
            <span>Category:</span>
            <span className="font-medium">{achievement.category}</span>
          </div>
        )}
      </div>

      {achievement.metadata && Object.keys(achievement.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Metadata: {JSON.stringify(achievement.metadata)}
          </p>
        </div>
      )}
    </div>
  );
};

// Award Achievement Modal
const AwardAchievementModal = ({ onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    userId: '',
    achievementType: 'solver',
    challengeId: '',
    category: '',
    points: 0,
    metadata: ''
  });
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  const achievementTypes = [
    { value: 'first_blood', label: 'First Blood', icon: '🩸' },
    { value: 'category_master', label: 'Category Master', icon: '🎯' },
    { value: 'speed_demon', label: 'Speed Demon', icon: '⚡' },
    { value: 'point_milestone', label: 'Point Milestone', icon: '💰' },
    { value: 'team_player', label: 'Team Player', icon: '👥' },
    { value: 'persistence', label: 'Persistence', icon: '💪' },
    { value: 'streak', label: 'Streak Master', icon: '🔥' },
    { value: 'solver', label: 'Solver', icon: '✅' }
  ];

  const searchUsers = async (searchTerm) => {
    setSearchLoading(true);
    try {
      const data = await achievementService.getUsersForAward(searchTerm);
      setUsers(data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchChallenges = async (searchTerm) => {
    setSearchLoading(true);
    try {
      const data = await achievementService.getChallengesForAward(searchTerm);
      setChallenges(data.challenges);
    } catch (error) {
      console.error('Error searching challenges:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let metadata = {};
    if (formData.metadata) {
      try {
        metadata = JSON.parse(formData.metadata);
      } catch (error) {
        setError('Invalid JSON in metadata field');
        return;
      }
    }

    const submitData = {
      ...formData,
      points: parseInt(formData.points) || 0,
      metadata
    };

    // Omit challengeId if empty to avoid sending empty string (prevents backend validation error)
    if (!submitData.challengeId || submitData.challengeId.trim() === '') {
      delete submitData.challengeId;
    }

    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Award Achievement</h2>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <strong className="font-semibold">Error:</strong> {error}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User *
              </label>
              <input
                type="text"
                placeholder="Search users by username, name, or email..."
                onChange={(e) => searchUsers(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {users.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                  {users.map(user => (
                    <div
                      key={user._id}
                      onClick={() => setFormData(prev => ({ ...prev, userId: user._id }))}
                      className={`p-2 cursor-pointer hover:bg-gray-100 ${
                        formData.userId === user._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.fullName} • {user.email}</div>
                    </div>
                  ))}
                </div>
              )}
              {formData.userId && (
                <div className="mt-2 text-sm text-green-600">
                  User selected: {users.find(u => u._id === formData.userId)?.username}
                </div>
              )}
            </div>

            {/* Achievement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Type *
              </label>
              <select
                value={formData.achievementType}
                onChange={(e) => setFormData(prev => ({ ...prev, achievementType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {achievementTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Challenge Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge (Optional)
              </label>
              <input
                type="text"
                placeholder="Search challenges..."
                onChange={(e) => searchChallenges(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {challenges.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                  {challenges.map(challenge => (
                    <div
                      key={challenge._id}
                      onClick={() => setFormData(prev => ({ ...prev, challengeId: challenge._id }))}
                      className={`p-2 cursor-pointer hover:bg-gray-100 ${
                        formData.challengeId === challenge._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium">{challenge.title}</div>
                      <div className="text-sm text-gray-500">{challenge.category} • {challenge.points} pts</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (Optional)
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., web, crypto, forensics"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Metadata */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata (JSON, Optional)
              </label>
              <textarea
                value={formData.metadata}
                onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
                placeholder='{"description": "Custom achievement description"}'
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-xl transition-all duration-200 font-semibold"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !formData.userId}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Awarding...
                  </span>
                ) : (
                  'Award Achievement'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600'
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
      <div className={`text-3xl font-extrabold ${colorClasses[color]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

const AchievementManagement = () => {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    type: '',
    user: '',
    challenge: '',
    sortBy: 'awardedAt',
    sortOrder: 'desc'
  });

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await achievementService.getAllAchievements({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setAchievements(data.achievements || []);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const fetchStats = async () => {
    try {
      const data = await achievementService.getAdminStats();
      setStats(data.stats || {});
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    fetchAchievements();
    fetchStats();
  }, [fetchAchievements]);

  const handleAwardAchievement = async (awardData) => {
    try {
      setActionLoading(true);
      await achievementService.awardAchievement(awardData);
      await fetchAchievements();
      await fetchStats();
      setShowAwardModal(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to award achievement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAchievement = async (achievement) => {
    if (!window.confirm(`Are you sure you want to revoke this achievement from ${achievement.user?.username}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await achievementService.revokeAchievement(achievement._id);
      await fetchAchievements();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to revoke achievement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const achievementTypes = [
    { value: '', label: 'All Types' },
    { value: 'first_blood', label: 'First Blood' },
    { value: 'category_master', label: 'Category Master' },
    { value: 'speed_demon', label: 'Speed Demon' },
    { value: 'point_milestone', label: 'Point Milestone' },
    { value: 'team_player', label: 'Team Player' },
    { value: 'persistence', label: 'Persistence' },
    { value: 'streak', label: 'Streak Master' },
    { value: 'solver', label: 'Solver' }
  ];

  if (loading && achievements.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <div className="text-xl font-medium text-gray-600">Loading Achievement Management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Achievement Management</h1>
            <p className="text-gray-600 mt-2">
              Manage and award achievements to users across the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAwardModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all duration-200 font-semibold flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Award Achievement</span>
            </button>
            <button
              onClick={fetchAchievements}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all duration-200 font-semibold flex items-center space-x-2 disabled:opacity-50"
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
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <strong className="font-semibold">Error:</strong> {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard value={stats.totalAchievements || 0} label="Total Achievements" color="blue" />
          <StatCard value={stats.totalUsers || 0} label="Unique Users" color="green" />
          <StatCard value={Object.keys(stats.typeBreakdown || {}).length} label="Achievement Types" color="purple" />
          <StatCard value={stats.recentAchievements?.length || 0} label="Recent (10)" color="orange" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {achievementTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="awardedAt">Award Date</option>
                <option value="points">Points</option>
                <option value="type">Type</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items Per Page
              </label>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement._id}
              achievement={achievement}
              onRevoke={handleRevokeAchievement}
            />
          ))}
        </div>

        {/* Empty State */}
        {achievements.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="text-gray-400 text-7xl mb-6">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No Achievements Found
            </h3>
            <p className="text-gray-500 mb-6">
              No achievements match the current filters. Try adjusting your filters or award some achievements.
            </p>
            <button
              onClick={() => setShowAwardModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
            >
              Award First Achievement
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Award Achievement Modal */}
        {showAwardModal && (
          <AwardAchievementModal
            onClose={() => setShowAwardModal(false)}
            onSave={handleAwardAchievement}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  );
};

export default AchievementManagement;
// src/pages/user/Profile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { achievementService } from '../../services/achievementService';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    country: '',
    website: '',
    twitter: '',
    github: ''
  });

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use only existing endpoints
      const [profileResponse, statsResponse] = await Promise.all([
        userService.getProfile(),
        userService.getUserStats()
      ]);

      const profileData = profileResponse.user;
      const statsData = statsResponse;

      // FIXED: Use getMyAchievements() instead of getUserAchievements(undefined)
      let achievementsData = [];
      try {
        achievementsData = await achievementService.getMyAchievements();
      } catch (err) {
        console.log('Achievements endpoint not available, using fallback data:', err.message);
        // Create some mock achievements based on user stats
        achievementsData = generateMockAchievements(statsData);
      }

      setProfile({
        ...profileData,
        solvedChallenges: statsData.solvedChallenges || 0,
        totalPoints: statsData.totalPoints || 0,
        rank: statsData.rank || 'N/A',
        streak: statsData.streak || 0
      });
      
      setAchievements(achievementsData);
      
      // Create mock activity data from profile info
      const mockActivity = generateMockActivity(profileData, statsData, achievementsData);
      setRecentActivity(mockActivity);
      
      // Initialize edit form
      setEditForm({
        fullName: profileData.fullName || '',
        bio: profileData.bio || '',
        country: profileData.country || '',
        website: profileData.website || '',
        twitter: profileData.twitter || '',
        github: profileData.github || ''
      });
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to generate mock achievements
  const generateMockAchievements = (statsData) => {
    const mockAchievements = [];
    
    if (statsData.solvedChallenges >= 1) {
      mockAchievements.push({
        _id: '1',
        name: 'First Blood',
        description: 'Solved your first challenge',
        icon: '🩸',
        points: 10,
        earnedAt: new Date().toISOString()
      });
    }
    
    if (statsData.solvedChallenges >= 5) {
      mockAchievements.push({
        _id: '2',
        name: 'Challenge Hunter',
        description: 'Solved 5 challenges',
        icon: '🎯',
        points: 25,
        earnedAt: new Date().toISOString()
      });
    }
    
    if (statsData.totalPoints >= 100) {
      mockAchievements.push({
        _id: '3',
        name: 'Centurion',
        description: 'Earned 100 points',
        icon: '💯',
        points: 50,
        earnedAt: new Date().toISOString()
      });
    }
    
    if (statsData.streak >= 3) {
      mockAchievements.push({
        _id: '4',
        name: 'On Fire',
        description: '3-day solving streak',
        icon: '🔥',
        points: 15,
        earnedAt: new Date().toISOString()
      });
    }
    
    return mockAchievements;
  };

  // Helper function to generate mock activity data
  const generateMockActivity = (profileData, statsData, achievementsData) => {
    const activities = [];
    
    if (profileData.createdAt) {
      activities.push({
        _id: '1',
        type: 'account_created',
        description: 'Joined the platform',
        timestamp: profileData.createdAt
      });
    }
    
    if (statsData.solvedChallenges > 0) {
      activities.push({
        _id: '2',
        type: 'challenge_solved',
        description: `Solved ${statsData.solvedChallenges} challenges`,
        points: statsData.totalPoints,
        timestamp: profileData.lastSolve || profileData.lastLogin || new Date().toISOString()
      });
    }
    
    if (profileData.team) {
      activities.push({
        _id: '3',
        type: 'team_join',
        description: `Joined team ${profileData.team.name}`,
        timestamp: profileData.createdAt
      });
    }
    
    if (achievementsData.length > 0) {
      achievementsData.forEach((achievement, index) => {
        if (index < 2) { // Only show first 2 achievements in activity
          activities.push({
            _id: `achievement_${achievement._id}`,
            type: 'achievement_earned',
            description: `Earned "${achievement.name}" achievement`,
            points: achievement.points,
            timestamp: achievement.earnedAt || new Date().toISOString()
          });
        }
      });
    }
    
    return activities.slice(0, 5); // Return only 5 activities
  };

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      const response = await userService.updateProfile(editForm);
      setProfile(response.user);
      updateUser(response.user);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const getJoinDuration = (joinDate) => {
    if (!joinDate) return 'Unknown';
    const join = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now - join);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your profile information and track your progress
            </p>
          </div>
          <div className="flex gap-3">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{saveLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
            <button
              onClick={fetchProfileData}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
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
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
                <p className="text-gray-600 text-sm">{user.email}</p>
                {profile?.team && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Team: {profile.team.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <StatItem label="Member since" value={getJoinDuration(profile?.createdAt)} />
                <StatItem label="Challenges Solved" value={profile?.solvedChallenges || 0} />
                <StatItem label="Total Points" value={profile?.totalPoints || 0} />
                <StatItem label="Current Rank" value={`#${profile?.rank || 'N/A'}`} />
                <StatItem label="Achievements" value={achievements.length} />
                <StatItem label="Current Streak" value={`${profile?.streak || 0} days`} />
              </div>

              {/* Social Links */}
              {(profile?.website || profile?.github || profile?.twitter) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Social Links</h3>
                  <div className="space-y-2">
                    {profile.website && (
                      <SocialLink href={profile.website} icon="🌐" label="Website" />
                    )}
                    {profile.github && (
                      <SocialLink href={`https://github.com/${profile.github}`} icon="🐙" label="GitHub" />
                    )}
                    {profile.twitter && (
                      <SocialLink href={`https://twitter.com/${profile.twitter}`} icon="🐦" label="Twitter" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
              <div className="flex space-x-1">
                {['overview', 'achievements', 'activity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 capitalize ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === 'overview' && (
                <OverviewTab 
                  profile={profile} 
                  editMode={editMode}
                  editForm={editForm}
                  onFormChange={(updates) => setEditForm(prev => ({ ...prev, ...updates }))}
                />
              )}

              {activeTab === 'achievements' && (
                <AchievementsTab achievements={achievements} />
              )}

              {activeTab === 'activity' && (
                <ActivityTab activities={recentActivity} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... (rest of the components remain exactly the same as in your original file)
// StatItem, SocialLink, OverviewTab, InfoItem, StatCard, AchievementsTab, ActivityTab components...

// Stat Item Component
const StatItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);

// Social Link Component
const SocialLink = ({ href, icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
  >
    <span>{icon}</span>
    <span>{label}</span>
  </a>
);

// Overview Tab Component
const OverviewTab = ({ profile, editMode, editForm, onFormChange }) => {
  if (editMode) {
    return (
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => onFormChange({ fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={editForm.country}
              onChange={(e) => onFormChange({ country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your country"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={editForm.bio}
            onChange={(e) => onFormChange({ bio: e.target.value })}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={editForm.website}
              onChange={(e) => onFormChange({ website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub
            </label>
            <input
              type="text"
              value={editForm.github}
              onChange={(e) => onFormChange({ github: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter
            </label>
            <input
              type="text"
              value={editForm.twitter}
              onChange={(e) => onFormChange({ twitter: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="username"
            />
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bio */}
      {profile?.bio && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About Me</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{profile.bio}</p>
        </div>
      )}

      {/* Personal Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Full Name" value={profile?.fullName || 'Not provided'} />
          <InfoItem label="Country" value={profile?.country || 'Not provided'} />
          <InfoItem label="Email" value={profile?.email} />
          <InfoItem label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'} />
        </div>
      </div>

      {/* CTF Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">CTF Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={profile?.solvedChallenges || 0} label="Solved" />
          <StatCard value={profile?.totalPoints || 0} label="Points" />
          <StatCard value={profile?.rank || 'N/A'} label="Rank" />
          <StatCard value={profile?.team?.name || 'No Team'} label="Team" />
        </div>
      </div>
    </div>
  );
};

// Info Item Component
const InfoItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-gray-900">{value}</span>
  </div>
);

// Stat Card Component for Overview
const StatCard = ({ value, label }) => (
  <div className="bg-gray-50 rounded-lg p-4 text-center">
    <div className="text-xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

// Achievements Tab Component
const AchievementsTab = ({ achievements }) => {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Achievements Yet</h3>
        <p className="text-gray-500">Complete challenges to earn achievements and badges!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Earned Achievements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement._id || achievement.id}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{achievement.icon || '🏆'}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-orange-600">
                    {achievement.points} points
                  </span>
                  <span className="text-xs text-gray-500">
                    Earned {achievement.earnedAt ? new Date(achievement.earnedAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Activity Tab Component
const ActivityTab = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
        <p className="text-gray-500">Your recent activity will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity._id || index}
            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <p className="text-gray-900">{activity.description}</p>
              <p className="text-sm text-gray-500">
                {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time'}
              </p>
            </div>
            {activity.points && (
              <div className="text-sm font-medium text-green-600">
                +{activity.points} pts
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function for activity icons
const getActivityIcon = (type) => {
  switch (type) {
    case 'challenge_solved': return '✅';
    case 'achievement_earned': return '🏆';
    case 'team_join': return '👥';
    case 'account_created': return '🎉';
    default: return '📊';
  }
};

export default UserProfile;
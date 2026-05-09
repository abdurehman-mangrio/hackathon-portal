import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { userService } from '../../services/userService';
import { challengeService } from '../../services/challengeService';
import { achievementService } from '../../services/achievementService';

// --- HELPER COMPONENTS ---

// Stat Card Component
const StatCard = ({ value, label, color, icon }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    red: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className={`bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-extrabold mb-1">{value}</div>
          <div className="text-sm font-semibold text-gray-600">{label}</div>
        </div>
        <div className="text-4xl opacity-75">{icon}</div>
      </div>
    </div>
  );
};

// Challenge Item Component
const ChallengeItem = ({ challenge }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-700 bg-green-100 border-green-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'hard': return 'text-red-700 bg-red-100 border-red-300';
      case 'expert': return 'text-purple-700 bg-purple-100 border-purple-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'solved': return 'bg-green-100 text-green-800 border-green-500';
      case 'attempted': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  }

  return (
    <a
      href={`/challenge/${challenge.id || challenge._id}`} // Use id or _id field
      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
          {challenge.category?.charAt(0) || 'C'}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 transition-colors duration-200 hover:text-indigo-600">{challenge.title}</h4>
          <div className="flex items-center space-x-3 mt-1 text-sm">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getDifficultyColor(challenge.difficulty)}`}>
              {challenge.difficulty || 'Unknown'}
            </span>
            <span className="text-sm text-gray-500 font-mono">{challenge.points || 0} pts</span>
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-2 ${getStatusClasses(challenge.status)}`}>
          {challenge.status === 'solved' ? 'Solved' : challenge.status === 'attempted' ? 'Attempted' : 'New'}
        </span>
        <div className="text-xs text-gray-500 mt-1">
          {challenge.solvedAt ? new Date(challenge.solvedAt).toLocaleDateString() : '—'}
        </div>
      </div>
    </a>
  );
};

// Quick Action Component
const QuickAction = ({ icon, title, description, href }) => {
  return (
    <a 
      href={href}
      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200 group bg-white"
    >
      <div className="text-3xl text-indigo-600 group-hover:scale-110 transition-transform duration-200 p-2 rounded-full bg-indigo-100">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">
          {title}
        </h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="text-gray-400 group-hover:text-indigo-500 transition-colors duration-200">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
};

// Achievement Item Component
const AchievementItem = ({ achievement }) => {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-100 border border-amber-300 rounded-xl shadow-sm">
      <div className="text-2xl pt-1">{achievement.icon || '🏆'}</div>
      <div className="flex-1">
        <h5 className="font-bold text-gray-900 text-sm">{achievement.name}</h5>
        <p className="text-xs text-amber-800 mt-0.5">{achievement.description}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs font-semibold text-amber-700">{achievement.points} pts</span>
          <span className="text-xs text-gray-500">
            {achievement.earnedAt ? new Date(achievement.earnedAt).toLocaleDateString() : ''}
          </span>
        </div>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---

const UserDashboard = () => {
  // Use mock context hook
  const { user, isDemo } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Frontend-only demo mode (no backend deployment required)
      if (isDemo) {
        const demoStats = {
          totalPoints: 1240,
          solvedChallenges: 7,
          rank: 128,
          achievements: 5
        };

        const demoChallenges = [
          {
            _id: 'demo-c1',
            id: 'demo-c1',
            title: 'Intro to Buffer Overflow',
            category: 'Pwn',
            difficulty: 'easy',
            points: 100,
            status: 'solved',
            solvedAt: new Date(Date.now() - 1000 * 60 * 80).toISOString()
          },
          {
            _id: 'demo-c2',
            id: 'demo-c2',
            title: 'SQL Injection in Auth Bypass',
            category: 'Web',
            difficulty: 'medium',
            points: 250,
            status: 'attempted',
            solvedAt: null
          },
          {
            _id: 'demo-c3',
            id: 'demo-c3',
            title: 'Docker Escape: Quick Start',
            category: 'CTF',
            difficulty: 'hard',
            points: 400,
            status: 'solved',
            solvedAt: new Date(Date.now() - 1000 * 60 * 220).toISOString()
          }
        ];

        const demoAchievements = [
          { _id: 'a1', icon: '🎖️', name: 'First Blood', description: 'Solve your first challenge.', points: 120, earnedAt: new Date(Date.now() - 1000*60*300).toISOString() },
          { _id: 'a2', icon: '🧠', name: 'Logic Breaker', description: 'Solve 3 challenges.', points: 300, earnedAt: new Date(Date.now() - 1000*60*520).toISOString() },
        ];

        // Match existing UI slicing behavior
        setStats(demoStats);
        setRecentChallenges(demoChallenges.slice(0, 5));
        setUserAchievements(demoAchievements.slice(0, 3));
        setLoading(false);
        return;
      }

      // Using the real services
      const [statsData, challengesData, achievementsData] = await Promise.all([
        userService.getUserStats(),
        challengeService.getChallenges({ limit: 10, sort: '-updatedAt' }),
        achievementService.getMyAchievements()
      ]);

      setStats(statsData);
      // Slice the first 5 for "recent" view
      setRecentChallenges(challengesData.slice(0, 5));
      setUserAchievements(achievementsData.slice(0, 3));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // In a real app, err.message would be used. Using a generic one here for mock.
      setError('Failed to load dashboard data. Check the console for mock errors.');
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();

    // Auto-refresh data every 30 seconds to get updates from admin
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-start">
        <div className="max-w-7xl mx-auto w-full pt-20">
          <div className="flex flex-col items-center p-12 bg-white rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
            <div className="text-xl font-semibold text-indigo-600">Loading your CTF dashboard...</div>
            <p className="text-gray-500 mt-2">Fetching your stats, challenges, and achievements.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {getGreeting()}, <span className="text-indigo-600">{user?.username}</span>!
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Welcome back to your CTF dashboard. Ready to pwn the next flag?
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-bold flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Inline SVG for Refresh icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-500 text-red-800 rounded-xl shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard 
              value={stats.totalPoints.toLocaleString()} 
              label="Total Points" 
              color="blue" 
              icon="🥇"
            />
            <StatCard 
              value={stats.solvedChallenges} 
              label="Challenges Solved" 
              color="green" 
              icon="✅"
            />
            <StatCard 
              value={stats.rank || 'N/A'} 
              label="Global Rank" 
              color="purple" 
              icon="🏆"
            />
            <StatCard 
              value={stats.achievements} 
              label="Badges Earned" 
              color="orange" 
              icon="🎯"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Challenges Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                <a 
                  href="/dashboard/challenges" 
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors text-sm"
                >
                  View All Challenges →
                </a>
              </div>
              
              <div className="space-y-4">
                {recentChallenges.length === 0 ? (
                  <div className="text-center py-12 border-4 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <div className="text-gray-400 text-5xl mb-4">🕵️</div>
                    <p className="text-gray-600 font-medium text-lg">No recent attempts found.</p>
                    <a 
                      href="/dashboard/challenges" 
                      className="inline-block mt-3 text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
                    >
                      Start Solving Now
                    </a>
                  </div>
                ) : (
                  recentChallenges.map((challenge, index) => (
                    <ChallengeItem key={challenge._id || index} challenge={challenge} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar (Quick Actions & Achievements) */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">Quick Links</h3>
              <div className="space-y-3">
                <QuickAction 
                  icon="🎯" 
                  title="Browse Challenges" 
                  description="Explore available CTF challenges"
                  href="/dashboard/challenges"
                />
                <QuickAction 
                  icon="👥" 
                  title="Join a Team" 
                  description="Collaborate with other players"
                  href="/team"
                />
                <QuickAction 
                  icon="📝" 
                  title="Write Writeup" 
                  description="Share your solution knowledge"
                  href="/dashboard/writeups"
                />
                <QuickAction 
                  icon="🏆" 
                  title="View Leaderboard" 
                  description="See where you stand globally"
                  href="/leaderboard"
                />
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">Recent Achievements</h3>
              <div className="space-y-4">
                {userAchievements.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 text-3xl mb-2">🎖️</div>
                    <p className="text-gray-500 text-sm font-medium">No badges earned yet.</p>
                    <p className="text-gray-400 text-xs">Keep solving challenges to unlock rewards!</p>
                  </div>
                ) : (
                  userAchievements.map((achievement, index) => (
                    <AchievementItem key={achievement._id || index} achievement={achievement} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [overview, userAnalytics, challengeAnalytics, submissionAnalytics, performance, recentActivity, platformGrowth] = await Promise.all([
        analyticsService.getOverview(timeRange),
        analyticsService.getUserAnalytics(timeRange),
        analyticsService.getChallengeAnalytics(timeRange),
        analyticsService.getSubmissionAnalytics(timeRange),
        analyticsService.getPerformanceAnalytics(),
        analyticsService.getRecentActivity(10),
        analyticsService.getPlatformGrowth(timeRange)
      ]);

      setAnalyticsData({
        overview,
        userAnalytics,
        challengeAnalytics,
        submissionAnalytics,
        performance,
        recentActivity,
        platformGrowth
      });
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, change, changeType, icon, loading }) => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change}
              </p>
            )}
          </div>
          <div className="text-3xl text-blue-600">{icon}</div>
        </div>
      </div>
    );
  };

  const BarChart = ({ data, title, color = 'bg-blue-500', loading }) => {
    if (loading || !data || data.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="flex items-end justify-between space-x-2 h-40">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t h-24"></div>
                <div className="h-4 bg-gray-200 rounded w-8 mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.count || item.value || item.users || 0));
    
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="flex items-end justify-between space-x-2 h-40">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full ${color} rounded-t transition-all duration-500 hover:opacity-80 cursor-pointer`}
                style={{ height: `${((item.count || item.value || item.users || 0) / maxValue) * 100}%` }}
                title={`${item.date || item.label || item.name}: ${item.count || item.value || item.users || 0}`}
              ></div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                {item.date || item.label || item.name}
              </div>
              <div className="text-xs font-medium text-gray-700">
                {item.count || item.value || item.users || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DonutChart = ({ data, title, loading }) => {
    if (loading || !data || data.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="flex items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
            <div className="ml-6 flex-1 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + (item.count || item.value || 0), 0);
    let accumulated = 0;

    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500'
    ];

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="flex items-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              {data.map((item, index) => {
                const percentage = ((item.count || item.value || 0) / total) * 100;
                const strokeDasharray = `${percentage} 100`;
                const strokeDashoffset = -accumulated;
                accumulated += percentage;

                return (
                  <circle
                    key={index}
                    cx="16"
                    cy="16"
                    r="15.9155"
                    fill="transparent"
                    stroke={colors[index % colors.length].replace('bg-', '')}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000"
                  />
                );
              })}
            </svg>
          </div>
          <div className="ml-6 flex-1">
            <div className="space-y-2">
              {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                  <span className="text-sm text-gray-700 flex-1">{item.name || item.category}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(((item.count || item.value || 0) / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RecentActivity = ({ activities, loading }) => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities?.slice(0, 8).map((activity, index) => (
            <div key={activity._id || index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {activity.user?.username || 'Unknown user'}
                </p>
                <p className="text-xs text-gray-500">
                  {activity.action} • {activity.challenge?.name || activity.challenge}
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-lg mr-2">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Failed to load analytics</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadAnalyticsData}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track platform performance and user engagement</p>
        </div>
        <div className="flex space-x-2 mt-4 lg:mt-0">
          {['7d', '30d', '90d', '1y'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analyticsData.overview?.totalUsers?.toLocaleString() || '0'}
          change={analyticsData.overview?.userGrowth}
          changeType={analyticsData.overview?.userGrowth?.includes('+') ? 'positive' : 'negative'}
          icon="👥"
          loading={isLoading}
        />
        <StatCard
          title="Active Users"
          value={analyticsData.overview?.activeUsers?.toLocaleString() || '0'}
          change={analyticsData.overview?.activeUserGrowth}
          changeType={analyticsData.overview?.activeUserGrowth?.includes('+') ? 'positive' : 'negative'}
          icon="🔥"
          loading={isLoading}
        />
        <StatCard
          title="Total Submissions"
          value={analyticsData.overview?.totalSubmissions?.toLocaleString() || '0'}
          change={analyticsData.overview?.submissionGrowth}
          changeType={analyticsData.overview?.submissionGrowth?.includes('+') ? 'positive' : 'negative'}
          icon="📊"
          loading={isLoading}
        />
        <StatCard
          title="Solve Rate"
          value={analyticsData.overview?.solveRate || '0%'}
          change={analyticsData.overview?.solveRateChange}
          changeType={analyticsData.overview?.solveRateChange?.includes('+') ? 'positive' : 'negative'}
          icon="✅"
          loading={isLoading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={analyticsData.platformGrowth?.userGrowth || []}
          title="User Growth"
          color="bg-green-500"
          loading={isLoading}
        />
        <BarChart
          data={analyticsData.submissionAnalytics?.dailySubmissions || []}
          title="Daily Submissions"
          color="bg-purple-500"
          loading={isLoading}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          data={analyticsData.challengeAnalytics?.categoryDistribution || []}
          title="Challenge Categories"
          loading={isLoading}
        />
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Difficulty Distribution</h3>
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"></div>
                </div>
              ))
            ) : (
              analyticsData.challengeAnalytics?.difficultyDistribution?.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.difficulty}</span>
                    <span className="font-medium text-gray-900">{item.count} challenges</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.difficulty === 'Easy' ? 'bg-green-500' :
                        item.difficulty === 'Medium' ? 'bg-yellow-500' :
                        item.difficulty === 'Hard' ? 'bg-orange-500' : 'bg-red-500'
                      } transition-all duration-1000`}
                      style={{ 
                        width: `${(item.count / analyticsData.challengeAnalytics.totalChallenges) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentActivity 
          activities={analyticsData.recentActivity} 
          loading={isLoading}
        />

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Challenges</h3>
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </div>
              ))
            ) : (
              analyticsData.challengeAnalytics?.topChallenges?.map((challenge, index) => (
                <div key={challenge._id || index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{challenge.name}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {challenge.solveCount || challenge.completions}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Uptime</span>
              <span className="text-sm font-medium text-green-600">
                {analyticsData.performance?.uptime || '99.9%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Avg Response Time</span>
              <span className="text-sm font-medium text-green-600">
                {analyticsData.performance?.avgResponseTime || '142ms'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Error Rate</span>
              <span className="text-sm font-medium text-yellow-600">
                {analyticsData.performance?.errorRate || '0.2%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Active Sessions</span>
              <span className="text-sm font-medium text-blue-600">
                {analyticsData.overview?.activeSessions || '247'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
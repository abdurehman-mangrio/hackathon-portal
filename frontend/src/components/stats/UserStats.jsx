// src/components/stats/UserStats.jsx
import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp,
  Terminal,
  User,
  Activity,
  Clock,
  Server,
  Award
} from 'lucide-react'

const UserStats = ({ user, stats }) => {
  const [animatedStats, setAnimatedStats] = useState({
    totalPoints: 0,
    solvedChallenges: 0,
    rank: 0,
    successRate: 0
  })

  useEffect(() => {
    // Animate stats counting up
    const duration = 1000
    const steps = 30
    const stepDuration = duration / steps

    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedStats({
        totalPoints: Math.floor((stats?.totalPoints || 0) * progress),
        solvedChallenges: Math.floor((stats?.solvedChallenges || 0) * progress),
        rank: stats?.rank ? Math.max(1, Math.floor(stats.rank - (stats.rank - 1) * (1 - progress))) : 0,
        successRate: Math.floor((stats?.successRate || 0) * progress)
      })

      if (currentStep >= steps) {
        clearInterval(interval)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [stats])

  const statCards = [
    {
      icon: Trophy,
      label: 'Total Points',
      value: animatedStats.totalPoints,
      suffix: 'pts',
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500'
    },
    {
      icon: Target,
      label: 'Challenges Solved',
      value: `${animatedStats.solvedChallenges}/${stats?.totalChallenges || 0}`,
      suffix: 'solved',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      label: 'Global Rank',
      value: `#${animatedStats.rank || '--'}`,
      suffix: 'position',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: `${animatedStats.successRate}%`,
      suffix: 'efficiency',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500'
    }
  ]

  const categoryStats = [
    { category: 'Web', solved: 3, total: 8, color: 'from-blue-500 to-cyan-500' },
    { category: 'Crypto', solved: 2, total: 6, color: 'from-yellow-500 to-amber-500' },
    { category: 'Forensics', solved: 1, total: 5, color: 'from-orange-500 to-red-500' },
    { category: 'Pwn', solved: 0, total: 4, color: 'from-purple-500 to-pink-500' },
    { category: 'Reverse', solved: 2, total: 5, color: 'from-green-500 to-emerald-500' },
    { category: 'Misc', solved: 1, total: 3, color: 'from-indigo-500 to-purple-500' }
  ]

  const recentActivity = [
    { action: 'Solved Web-200', time: '2m ago', points: '+200', status: 'success' },
    { action: 'Solved Crypto-100', time: '15m ago', points: '+100', status: 'success' },
    { action: 'Solved Forensics-150', time: '1h ago', points: '+150', status: 'success' },
    { action: 'Failed Pwn-300', time: '2h ago', points: '+0', status: 'failed' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Performance Overview</h1>
              <p className="text-gray-600">Welcome back, {user?.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <User className="w-5 h-5" />
            <span className="text-sm">{user?.username}</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {stat.suffix}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-gray-900">
              <Activity className="w-5 h-5" />
              <span className="text-lg font-bold">Category Progress</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((cat, index) => {
              const percentage = cat.total > 0 ? Math.round((cat.solved / cat.total) * 100) : 0
              
              return (
                <div 
                  key={index} 
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{cat.category}</div>
                      <div className="text-xs text-gray-600">
                        {cat.solved}/{cat.total} solved
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-600 font-bold text-lg">{percentage}%</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${cat.color} transition-all duration-1000`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{percentage}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-gray-900">
                <Clock className="w-5 h-5" />
                <span className="font-bold">Recent Activity</span>
              </div>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                      activity.status === 'success' 
                        ? 'bg-green-100 text-green-600 border-green-200' 
                        : 'bg-red-100 text-red-600 border-red-200'
                    }`}>
                      {activity.status === 'success' ? '✓' : '✗'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                      <div className="text-xs text-gray-500">{activity.time}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${
                    activity.status === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activity.points}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-gray-900">
                <Server className="w-5 h-5" />
                <span className="font-bold">Status</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-600">Session Time</div>
                  <div className="text-lg font-bold text-gray-900">02:34:17</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-600">Avg Score</div>
                  <div className="text-lg font-bold text-gray-900">87.5</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-700 font-medium">Next Rank</span>
                  <span className="font-bold text-gray-900">#18</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: '72%' }}
                  ></div>
                </div>
                <div className="text-xs text-blue-600 text-center">
                  215 points to next tier
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center space-x-2 text-yellow-700">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">Achievements</span>
                </div>
                <span className="text-sm font-bold text-gray-900">8/15</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserStats
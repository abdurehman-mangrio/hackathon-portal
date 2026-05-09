import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users, 
  Award, 
  Star,
  Terminal,
  Cpu,
  Network,
  Shield,
  Zap,
  Clock,
  Eye,
  User,
  Server,
  Binary,
  Scan
} from 'lucide-react'
import leaderboardService from '../services/leaderboardService'

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('all')
  const [terminalOutput, setTerminalOutput] = useState([])
  const [currentUserRank, setCurrentUserRank] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [timeRange])

  const addTerminalLine = (text, type = 'info') => {
    setTerminalOutput(prev => [...prev, { 
      text, 
      type, 
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    }])
  }

  const fetchLeaderboard = async () => {
    try {
      addTerminalLine('Accessing global rankings database...', 'system')
      setLoading(true)
      const data = await leaderboardService.getLeaderboard(timeRange)
      setLeaderboard(data)

      // Get current user rank
      try {
        const rankData = await leaderboardService.getUserRank()
        setCurrentUserRank(rankData.rank)
      } catch (rankError) {
        // Fallback to simulation if rank API fails
        setCurrentUserRank(Math.floor(Math.random() * data.length) + 1)
      }

      addTerminalLine(`Rankings loaded: ${data.length} operators detected`, 'success')
    } catch (error) {
      addTerminalLine('ERROR: Failed to access ranking system', 'error')
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />
      case 2:
        return <Medal className="w-6 h-6 text-orange-400" />
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded-full border border-green-500">
            <span className="text-xs font-bold text-green-400">{index + 1}</span>
          </div>
        )
    }
  }

  const getRankColor = (index) => {
    switch (index) {
      case 0: return 'from-yellow-500 to-yellow-600'
      case 1: return 'from-gray-400 to-gray-600'
      case 2: return 'from-orange-500 to-orange-600'
      default: return 'from-green-500 to-cyan-600'
    }
  }

  const getRankBadge = (index) => {
    switch (index) {
      case 0: return { text: 'ELITE', color: 'text-yellow-400 border-yellow-400 bg-yellow-400 bg-opacity-10' }
      case 1: return { text: 'VETERAN', color: 'text-gray-300 border-gray-300 bg-gray-300 bg-opacity-10' }
      case 2: return { text: 'OPERATOR', color: 'text-orange-400 border-orange-400 bg-orange-400 bg-opacity-10' }
      default: 
        if (index < 10) return { text: 'PRO', color: 'text-cyan-400 border-cyan-400 bg-cyan-400 bg-opacity-10' }
        return { text: 'AGENT', color: 'text-green-400 border-green-400 bg-green-400 bg-opacity-10' }
    }
  }

  const timeRanges = [
    { value: 'all', label: 'GLOBAL_RANKINGS', command: 'cat /var/log/global_rank' },
    { value: 'weekly', label: 'WEEKLY_STANDINGS', command: './stats --period weekly' },
    { value: 'daily', label: 'DAILY_PERFORMANCE', command: './stats --period daily' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-green-400 font-mono">ACCESSING_RANKINGS...</div>
          <div className="text-green-600 text-sm mt-2">Decrypting leaderboard data</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Terminal Header */}
        <div className="bg-black border border-green-500 rounded-lg shadow-2xl shadow-green-500/20 mb-8">
          <div className="flex items-center space-x-2 p-4 border-b border-green-500/30">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="text-green-400 text-sm ml-2">cyber-arena.ctf -- ranking_system</div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center space-x-2 text-green-300 mb-4">
              <Terminal className="w-5 h-5" />
              <span className="text-sm">GLOBAL_OPERATOR_RANKINGS</span>
            </div>

            {/* Terminal Output */}
            <div className="bg-black border border-green-500 rounded-lg p-4 mb-6 h-24 overflow-y-auto">
              {terminalOutput.map((line, index) => (
                <div key={index} className={`text-sm ${
                  line.type === 'error' ? 'text-red-400' :
                  line.type === 'success' ? 'text-green-400' :
                  line.type === 'system' ? 'text-cyan-400' : 'text-green-300'
                }`}>
                  <span className="text-gray-500">[{line.timestamp}]</span> {line.text}
                </div>
              ))}
            </div>

            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl mb-4 border border-yellow-400 shadow-lg shadow-yellow-500/25">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 glitch" data-text="OPERATOR_RANKINGS">
                OPERATOR_RANKINGS
              </h1>
              <p className="text-green-300">Elite cybersecurity operators performance metrics</p>
            </div>
          </div>
        </div>

        {/* Time Range Filters */}
        <div className="flex justify-center mb-8">
          <div className="bg-black border border-green-500 rounded-lg p-2">
            <div className="flex flex-wrap justify-center gap-2">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-6 py-3 rounded-lg font-bold text-sm transition-all border ${
                    timeRange === range.value
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/25'
                      : 'text-green-400 border-green-500 hover:border-cyan-400 hover:text-cyan-400'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black border border-green-500 rounded-lg p-6 text-center hover:border-cyan-400 transition-all group">
            <Users className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white">{leaderboard.length}</div>
            <div className="text-green-300">ACTIVE_OPERATORS</div>
          </div>
          <div className="bg-black border border-green-500 rounded-lg p-6 text-center hover:border-cyan-400 transition-all group">
            <Award className="w-8 h-8 text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white">
              {leaderboard.reduce((sum, user) => sum + (user.solvedChallenges || 0), 0)}
            </div>
            <div className="text-green-300">TOTAL_BREACHES</div>
          </div>
          <div className="bg-black border border-green-500 rounded-lg p-6 text-center hover:border-cyan-400 transition-all group">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white">
              {leaderboard.reduce((sum, user) => sum + (user.totalPoints || 0), 0)}
            </div>
            <div className="text-green-300">TOTAL_POINTS</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-black border border-green-500 rounded-lg shadow-2xl shadow-green-500/20 overflow-hidden mb-8">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-gradient-to-r from-green-900 to-cyan-900 px-6 py-4 text-sm font-bold text-white border-b border-green-500">
            <div className="col-span-1">RANK</div>
            <div className="col-span-4">OPERATOR</div>
            <div className="col-span-2 text-center">BREACHES</div>
            <div className="col-span-2 text-center">POINTS</div>
            <div className="col-span-2 text-center">LAST_ACTIVITY</div>
            <div className="col-span-1 text-center">STATUS</div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">NO_DATA_AVAILABLE</h3>
              <p className="text-green-300">Initiate system penetration to appear in rankings</p>
            </div>
          ) : (
            <div className="divide-y divide-green-500 divide-opacity-30">
              {leaderboard.map((user, index) => {
                const rankBadge = getRankBadge(index)
                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-12 px-6 py-4 items-center transition-all hover:bg-green-500 hover:bg-opacity-5 ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 bg-opacity-5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex items-center">
                      {getRankIcon(index)}
                    </div>

                    {/* Player Info */}
                    <div className="col-span-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(index)} flex items-center justify-center text-white font-bold border-2 border-white border-opacity-20`}>
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center space-x-2">
                            <span>{user.username}</span>
                            {index < 3 && <Star className="w-4 h-4 text-yellow-400" />}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded border ${rankBadge.color} inline-block mt-1`}>
                            {rankBadge.text}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Solved Challenges */}
                    <div className="col-span-2 text-center">
                      <div className="text-lg font-bold text-cyan-400">
                        {user.solvedChallenges || 0}
                      </div>
                      <div className="text-xs text-green-300">BREACHES</div>
                    </div>

                    {/* Points */}
                    <div className="col-span-2 text-center">
                      <div className="text-lg font-bold text-yellow-400">
                        {user.totalPoints || 0}
                      </div>
                      <div className="text-xs text-green-300">POINTS</div>
                    </div>

                    {/* Last Solve */}
                    <div className="col-span-2 text-center">
                      <div className="text-sm text-green-300">
                        {user.lastSolve 
                          ? new Date(user.lastSolve).toLocaleDateString()
                          : 'INACTIVE'
                        }
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto ${
                        user.lastSolve && (Date.now() - new Date(user.lastSolve).getTime()) < 24 * 60 * 60 * 1000
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-gray-500'
                      }`}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Current User Position & CTA */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Position */}
          {currentUserRank && (
            <div className="bg-black border border-cyan-500 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">YOUR_POSITION</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">#{currentUserRank}</div>
                <div className="text-green-300 text-sm">GLOBAL_RANKING</div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-green-500 h-2 rounded-full"
                    style={{ width: `${((leaderboard.length - currentUserRank) / leaderboard.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-green-900 via-black to-cyan-900 border border-green-500 rounded-lg p-6 text-center">
            <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">READY_TO_CLIMB?</h3>
            <p className="text-green-300 text-sm mb-4">
              Execute more successful breaches to advance your ranking
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all border border-cyan-400">
              DEPLOY_OPERATIONS
            </button>
          </div>
        </div>

        {/* System Footer */}
        <div className="bg-black border border-green-500 rounded-lg p-4 mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-green-300">RANKING_ALGO</div>
              <div className="text-white font-bold">ELO_V2.4</div>
            </div>
            <div>
              <div className="text-green-300">UPDATE_FREQ</div>
              <div className="text-white font-bold">REAL_TIME</div>
            </div>
            <div>
              <div className="text-green-300">DATA_SOURCE</div>
              <div className="text-white font-bold">SECURE_DB</div>
            </div>
            <div>
              <div className="text-green-300">VALIDATION</div>
              <div className="text-white font-bold">ACTIVE</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glitch {
          position: relative;
        }
        
        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .glitch::before {
          animation: glitch-1 0.5s infinite linear alternate-reverse;
          color: #ff00ff;
          z-index: -1;
        }
        
        .glitch::after {
          animation: glitch-2 0.5s infinite linear alternate-reverse;
          color: #00ffff;
          z-index: -2;
        }
        
        @keyframes glitch-1 {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        
        @keyframes glitch-2 {
          0% { transform: translate(0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(2px, 2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(-2px, 2px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  )
}

export default Leaderboard
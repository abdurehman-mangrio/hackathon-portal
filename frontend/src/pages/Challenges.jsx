// import React, { useState, useEffect } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import ChallengeCard from '../components/challenges/ChallengeCard'
// import UserStats from '../components/stats/UserStats'
// import CTFTerminal from '../components/terminal/CTFTerminal';
// import SecureChallengeStart from '../components/security/SecureChallengeStart';
// import { 
//   Filter, 
//   Search, 
//   Grid, 
//   List, 
//   Trophy,
//   Terminal,
//   Cpu,
//   Network,
//   Binary,
//   FileSearch,
//   Key,
//   Bug,
//   Zap,
//   Eye,
//   EyeOff,
//   Server,
//   Clock,
//   Award,
//   Shield,
//   AlertTriangle,
//   CheckCircle,
//   XCircle,
//   Loader
// } from 'lucide-react'
// import axios from 'axios'

// const Challenges = () => {
//   const [challenges, setChallenges] = useState([])
//   const [filteredChallenges, setFilteredChallenges] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedCategory, setSelectedCategory] = useState('all')
//   const [selectedDifficulty, setSelectedDifficulty] = useState('all')
//   const [viewMode, setViewMode] = useState('grid')
//   const [userStats, setUserStats] = useState({})
//   const [showFilters, setShowFilters] = useState(false)
//   const [terminalOutput, setTerminalOutput] = useState([])
//   const [secureSession, setSecureSession] = useState(null)
//   const [sessionData, setSessionData] = useState(null)
//   const [autoRefresh, setAutoRefresh] = useState(true)

//   const { user } = useAuth()

//   const categories = [
//     { value: 'all', label: 'ALL SYSTEMS', icon: Terminal, color: 'from-gray-500 to-gray-700', bgColor: 'bg-gradient-to-r from-gray-500 to-gray-700' },
//     { value: 'web', label: 'WEB EXPLOITATION', icon: Network, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
//     { value: 'crypto', label: 'CRYPTOGRAPHY', icon: Key, color: 'from-yellow-500 to-amber-500', bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
//     { value: 'forensics', label: 'DIGITAL FORENSICS', icon: FileSearch, color: 'from-orange-500 to-red-500', bgColor: 'bg-gradient-to-r from-orange-500 to-red-500' },
//     { value: 'pwn', label: 'BINARY EXPLOITATION', icon: Binary, color: 'from-purple-500 to-pink-500', bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500' },
//     { value: 'reverse', label: 'REVERSE ENGINEERING', icon: Cpu, color: 'from-green-500 to-emerald-500', bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500' },
//     { value: 'misc', label: 'MISCELLANEOUS', icon: Bug, color: 'from-indigo-500 to-purple-500', bgColor: 'bg-gradient-to-r from-indigo-500 to-purple-500' }
//   ]

//   const difficulties = [
//     { value: 'all', label: 'ALL DIFFICULTIES', color: 'text-gray-400', badgeColor: 'bg-gray-500' },
//     { value: 'easy', label: 'BEGINNER', color: 'text-green-400', badgeColor: 'bg-green-500' },
//     { value: 'medium', label: 'INTERMEDIATE', color: 'text-yellow-400', badgeColor: 'bg-yellow-500' },
//     { value: 'hard', label: 'EXPERT', color: 'text-red-400', badgeColor: 'bg-red-500' }
//   ]

//   const addTerminalLine = (text, type = 'info') => {
//     setTerminalOutput(prev => [...prev.slice(-19), { 
//       text, 
//       type, 
//       timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
//     }])
//   }

//   // Auto-refresh challenges
//   useEffect(() => {
//     if (autoRefresh) {
//       const interval = setInterval(() => {
//         fetchChallenges()
//       }, 30000) // Refresh every 30 seconds
//       return () => clearInterval(interval)
//     }
//   }, [autoRefresh])

//   useEffect(() => {
//     fetchChallenges()
//     fetchUserStats()
//   }, [])

//   useEffect(() => {
//     filterChallenges()
//   }, [challenges, searchTerm, selectedCategory, selectedDifficulty])

//   const fetchChallenges = async () => {
//     try {
//       if (terminalOutput.length === 0) {
//         addTerminalLine('Initializing challenge database...', 'system')
//       }
//       const response = await axios.get('/api/challenges')
//       setChallenges(response.data)
//       if (terminalOutput.length > 0) {
//         addTerminalLine(`Challenge database synchronized - ${response.data.length} targets`, 'success')
//       }
//     } catch (error) {
//       addTerminalLine('ERROR: Failed to load challenges - ' + error.message, 'error')
//       console.error('Error fetching challenges:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchUserStats = async () => {
//     try {
//       const response = await axios.get('/api/challenges')
//       const solved = response.data.filter(c => c.solved).length
//       const total = response.data.length
//       const totalPoints = response.data
//         .filter(c => c.solved)
//         .reduce((sum, c) => sum + c.points, 0)
      
//       setUserStats({
//         solvedChallenges: solved,
//         totalChallenges: total,
//         totalPoints: totalPoints,
//         successRate: total > 0 ? Math.round((solved / total) * 100) : 0,
//         averagePoints: solved > 0 ? Math.round(totalPoints / solved) : 0
//       })
//     } catch (error) {
//       console.error('Error fetching user stats:', error)
//       addTerminalLine('WARNING: Failed to update user statistics', 'error')
//     }
//   }

//   const filterChallenges = () => {
//     let filtered = challenges

//     if (searchTerm) {
//       filtered = filtered.filter(challenge =>
//         challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         challenge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (challenge.tags && challenge.tags.some(tag => 
//           tag.toLowerCase().includes(searchTerm.toLowerCase())
//         ))
//       )
//     }

//     if (selectedCategory !== 'all') {
//       filtered = filtered.filter(challenge => challenge.category === selectedCategory)
//     }

//     if (selectedDifficulty !== 'all') {
//       filtered = filtered.filter(challenge => challenge.difficulty === selectedDifficulty)
//     }

//     setFilteredChallenges(filtered)
    
//     // Add terminal feedback for filtering
//     if (searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all') {
//       addTerminalLine(`Filter applied: ${filtered.length} targets match criteria`, 'system')
//     }
//   }

//   const startSecureSession = async (challengeId) => {
//     try {
//       addTerminalLine(`Initializing secure environment for challenge ${challengeId}...`, 'system')
//       const response = await axios.post('/api/secure-session/initialize', {
//         challengeId: challengeId
//       })

//       const data = await response.data
//       setSessionData(data.session)
//       setSecureSession('active')
//       addTerminalLine('Secure session initialized - Webcam monitoring activated', 'success')
//     } catch (error) {
//       addTerminalLine('ERROR: Failed to start secure session - ' + error.message, 'error')
//       console.error('Failed to start secure session:', error)
//     }
//   }

//   const handleChallengeSolve = (challengeId, points) => {
//     setChallenges(prev =>
//       prev.map(challenge =>
//         challenge.id === challengeId
//           ? { ...challenge, solved: true }
//           : challenge
//       )
//     )
//     addTerminalLine(`🎯 TARGET NEUTRALIZED: Challenge ${challengeId} completed! +${points} points`, 'success')
//     fetchUserStats()
    
//     // Add celebration effect
//     setTimeout(() => {
//       addTerminalLine('⚡ System access granted - Proceeding to next objective', 'system')
//     }, 1000)
//   }

//   const handleViolation = (violation) => {
//     addTerminalLine(`🚨 SECURITY VIOLATION: ${violation.type} detected`, 'error')
//   }

//   const handleTerminate = (reason) => {
//     addTerminalLine(`🛑 SESSION TERMINATED: ${reason}`, 'error')
//     setSecureSession(null)
//     setSessionData(null)
//   }

//   const getCategoryIcon = (category) => {
//     const cat = categories.find(c => c.value === category)
//     return cat ? cat.icon : Terminal
//   }

//   const getDifficultyColor = (difficulty) => {
//     switch (difficulty) {
//       case 'easy': return 'text-green-400 border-green-500 bg-green-500 bg-opacity-10'
//       case 'medium': return 'text-yellow-400 border-yellow-500 bg-yellow-500 bg-opacity-10'
//       case 'hard': return 'text-red-400 border-red-500 bg-red-500 bg-opacity-10'
//       default: return 'text-gray-400 border-gray-500 bg-gray-500 bg-opacity-10'
//     }
//   }

//   const clearAllFilters = () => {
//     setSearchTerm('')
//     setSelectedCategory('all')
//     setSelectedDifficulty('all')
//     addTerminalLine('All filters cleared - Showing complete target list', 'system')
//   }

//   if (secureSession === 'active' && sessionData) {
//     return (
//       <SecureChallengeStart
//         sessionId={sessionData.sessionId}
//         challengeId={sessionData.challenge.id}
//         onViolation={handleViolation}
//         onTerminate={handleTerminate}
//         challenge={challenges.find(c => c.id === sessionData.challenge.id)}
//       />
//     )
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <div className="text-green-400 font-mono text-lg">INITIALIZING_CHALLENGE_DATABASE</div>
//           <div className="text-green-600 text-sm mt-2 animate-pulse">Establishing secure connection...</div>
//           <div className="mt-4 flex space-x-2 justify-center">
//             <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
//             <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
//             <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-950 text-green-400 font-mono">
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         {/* Terminal Header */}
//         <div className="bg-black border border-green-500 rounded-lg shadow-2xl shadow-green-500/20 mb-8">
//           <div className="flex items-center justify-between p-4 border-b border-green-500/30">
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
//               <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//               <div className="text-green-400 text-sm ml-2">cyber-arena.ctf -- challenge_interface</div>
//             </div>
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => setAutoRefresh(!autoRefresh)}
//                 className={`text-xs px-3 py-1 rounded border ${
//                   autoRefresh 
//                     ? 'bg-green-500 bg-opacity-20 border-green-500 text-green-400' 
//                     : 'bg-gray-500 bg-opacity-20 border-gray-500 text-gray-400'
//                 }`}
//               >
//                 AUTO: {autoRefresh ? 'ON' : 'OFF'}
//               </button>
//               <button
//                 onClick={fetchChallenges}
//                 className="text-xs px-3 py-1 rounded border border-cyan-500 bg-cyan-500 bg-opacity-10 text-cyan-400 hover:bg-cyan-500 hover:bg-opacity-20"
//               >
//                 SYNC
//               </button>
//             </div>
//           </div>
          
//           <div className="p-6">
//             <div className="flex items-center space-x-2 text-green-300 mb-4">
//               <Terminal className="w-5 h-5" />
//               <span className="text-sm">CHALLENGE_MANAGEMENT_SYSTEM v2.1.4</span>
//             </div>

//             {/* Terminal Output */}
//             <div className="bg-black border border-green-500 rounded-lg p-4 mb-6 h-32 overflow-y-auto">
//               {terminalOutput.length === 0 ? (
//                 <div className="text-green-600 text-sm">
//                   <div>$ Initializing terminal...</div>
//                   <div>$ Loading challenge database...</div>
//                   <div>$ Establishing secure connection...</div>
//                   <div>$ Ready for operations</div>
//                 </div>
//               ) : (
//                 terminalOutput.map((line, index) => (
//                   <div key={index} className={`text-sm ${
//                     line.type === 'error' ? 'text-red-400' :
//                     line.type === 'success' ? 'text-green-400' :
//                     line.type === 'system' ? 'text-cyan-400' : 'text-green-300'
//                   }`}>
//                     <span className="text-gray-500">[{line.timestamp}]</span> {line.text}
//                   </div>
//                 ))
//               )}
//             </div>

//             {/* User Stats */}
//             <UserStats user={user} stats={userStats} />
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex flex-col lg:flex-row gap-6">
//           {/* Sidebar Filters */}
//           <div className="lg:w-1/4 space-y-6">
//             {/* Search Box */}
//             <div className="bg-black border border-green-500 rounded-lg p-4">
//               <label className="block text-sm font-bold text-green-400 mb-2">
//                 <Search className="w-4 h-4 inline mr-2" />
//                 [SEARCH] TARGET_SCAN
//               </label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
//                 <input
//                   type="text"
//                   placeholder="grep -r 'flag' ./challenges"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 transition-all font-mono text-sm"
//                 />
//               </div>
//             </div>

//             {/* Category Filter */}
//             <div className="bg-black border border-green-500 rounded-lg p-4">
//               <div className="flex items-center justify-between mb-4">
//                 <label className="block text-sm font-bold text-green-400">
//                   <Filter className="w-4 h-4 inline mr-2" />
//                   [FILTER] OPERATION_TYPES
//                 </label>
//                 <div className="text-green-400 text-xs">
//                   {categories.find(c => c.value === selectedCategory)?.label.split(' ')[0]}
//                 </div>
//               </div>
//               <div className="space-y-2 max-h-96 overflow-y-auto">
//                 {categories.map(category => {
//                   const Icon = category.icon
//                   return (
//                     <button
//                       key={category.value}
//                       onClick={() => setSelectedCategory(category.value)}
//                       className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all text-left group ${
//                         selectedCategory === category.value
//                           ? 'border-cyan-400 bg-cyan-500 bg-opacity-10 text-cyan-400 shadow-lg shadow-cyan-500/20'
//                           : 'border-green-500 text-green-400 hover:border-cyan-400 hover:bg-cyan-500 hover:bg-opacity-5 hover:shadow-lg hover:shadow-cyan-500/10'
//                       }`}
//                     >
//                       <div className={`w-8 h-8 rounded-lg ${category.bgColor} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
//                         <Icon className="w-4 h-4 text-white" />
//                       </div>
//                       <span className="text-sm font-semibold flex-1">{category.label}</span>
//                       {selectedCategory === category.value && (
//                         <CheckCircle className="w-4 h-4 text-cyan-400" />
//                       )}
//                     </button>
//                   )
//                 })}
//               </div>
//             </div>

//             {/* Difficulty Filter */}
//             <div className="bg-black border border-green-500 rounded-lg p-4">
//               <label className="block text-sm font-bold text-green-400 mb-4">
//                 <Zap className="w-4 h-4 inline mr-2" />
//                 [DIFFICULTY] THREAT_LEVEL
//               </label>
//               <div className="space-y-2">
//                 {difficulties.map(difficulty => (
//                   <button
//                     key={difficulty.value}
//                     onClick={() => setSelectedDifficulty(difficulty.value)}
//                     className={`w-full p-3 rounded-lg border transition-all text-left group relative overflow-hidden ${
//                       selectedDifficulty === difficulty.value
//                         ? 'border-cyan-400 bg-cyan-500 bg-opacity-10 text-cyan-400 shadow-lg shadow-cyan-500/20'
//                         : `${difficulty.color} border-green-500 hover:border-cyan-400 hover:bg-cyan-500 hover:bg-opacity-5`
//                     }`}
//                   >
//                     <span className="text-sm font-semibold relative z-10">{difficulty.label}</span>
//                     {selectedDifficulty === difficulty.value && (
//                       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                         <CheckCircle className="w-4 h-4 text-cyan-400" />
//                       </div>
//                     )}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Quick Stats */}
//             <div className="bg-black border border-cyan-500 rounded-lg p-4">
//               <label className="block text-sm font-bold text-cyan-400 mb-4">
//                 <Server className="w-4 h-4 inline mr-2" />
//                 [STATUS] SYSTEM_OVERVIEW
//               </label>
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <span className="text-green-300 text-sm">ACTIVE_TARGETS</span>
//                   <span className="text-white font-bold">{challenges.length}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-green-300 text-sm">FILTERED_TARGETS</span>
//                   <span className="text-white font-bold">{filteredChallenges.length}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-green-300 text-sm">NEUTRALIZED</span>
//                   <span className="text-green-400 font-bold">{userStats.solvedChallenges || 0}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-green-300 text-sm">SUCCESS_RATE</span>
//                   <span className="text-yellow-400 font-bold">{userStats.successRate || 0}%</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-green-300 text-sm">TOTAL_POINTS</span>
//                   <span className="text-cyan-400 font-bold">{userStats.totalPoints || 0}</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Main Challenges Area */}
//           <div className="lg:w-3/4 space-y-6">
//             {/* Controls Bar */}
//             <div className="bg-black border border-green-500 rounded-lg p-4">
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
//                 <div className="flex items-center space-x-4">
//                   <span className="text-green-300 text-sm font-bold">
//                     DISPLAYING {filteredChallenges.length} OF {challenges.length} TARGETS
//                   </span>
//                   {(searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
//                     <button
//                       onClick={clearAllFilters}
//                       className="text-cyan-400 hover:text-cyan-300 text-sm font-bold border border-cyan-400 px-3 py-1 rounded hover:bg-cyan-500 hover:bg-opacity-10 transition-all"
//                     >
//                       [CLEAR_FILTERS]
//                     </button>
//                   )}
//                 </div>

//                 <div className="flex items-center space-x-4">
//                   <span className="text-green-300 text-sm">VIEW_MODE:</span>
//                   <div className="flex border border-green-500 rounded-lg overflow-hidden">
//                     <button
//                       onClick={() => setViewMode('grid')}
//                       className={`p-2 transition-all ${
//                         viewMode === 'grid' 
//                           ? 'bg-cyan-500 text-white' 
//                           : 'bg-black text-green-400 hover:bg-cyan-500 hover:bg-opacity-10'
//                       }`}
//                       title="Grid View"
//                     >
//                       <Grid className="w-4 h-4" />
//                     </button>
//                     <button
//                       onClick={() => setViewMode('list')}
//                       className={`p-2 transition-all ${
//                         viewMode === 'list' 
//                           ? 'bg-cyan-500 text-white' 
//                           : 'bg-black text-green-400 hover:bg-cyan-500 hover:bg-opacity-10'
//                       }`}
//                       title="List View"
//                     >
//                       <List className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Challenges Grid/List */}
//             {filteredChallenges.length === 0 ? (
//               <div className="bg-black border border-green-500 rounded-lg p-12 text-center">
//                 <Filter className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
//                 <h3 className="text-xl font-bold text-white mb-2">NO TARGETS FOUND</h3>
//                 <p className="text-green-300 mb-4">Adjust your search parameters or clear filters</p>
//                 <button
//                   onClick={clearAllFilters}
//                   className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all border border-cyan-400 shadow-lg shadow-cyan-500/20"
//                 >
//                   RESET_FILTERS
//                 </button>
//               </div>
//             ) : (
//               <div className={viewMode === 'grid' 
//                 ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' 
//                 : 'space-y-4'
//               }>
//                 {filteredChallenges.map(challenge => (
//                   <ChallengeCard
//                     key={challenge.id}
//                     challenge={challenge}
//                     onSolve={handleChallengeSolve}
//                     onStartSecureSession={startSecureSession}
//                     viewMode={viewMode}
//                   />
//                 ))}
//               </div>
//             )}

//             {/* System Status Footer */}
//             <div className="bg-black border border-green-500 rounded-lg p-4">
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
//                 <div className="text-green-400">
//                   <div className="text-xs uppercase tracking-wider">CHALLENGE_DB</div>
//                   <div className="text-white font-bold text-lg flex items-center justify-center">
//                     <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                     ONLINE
//                   </div>
//                 </div>
//                 <div className="text-cyan-400">
//                   <div className="text-xs uppercase tracking-wider">AUTH_SYSTEM</div>
//                   <div className="text-white font-bold text-lg flex items-center justify-center">
//                     <Shield className="w-4 h-4 mr-2" />
//                     SECURE
//                   </div>
//                 </div>
//                 <div className="text-yellow-400">
//                   <div className="text-xs uppercase tracking-wider">FLAG_SYSTEM</div>
//                   <div className="text-white font-bold text-lg flex items-center justify-center">
//                     <Key className="w-4 h-4 mr-2" />
//                     ACTIVE
//                   </div>
//                 </div>
//                 <div className="text-green-400">
//                   <div className="text-xs uppercase tracking-wider">SCOREBOARD</div>
//                   <div className="text-white font-bold text-lg flex items-center justify-center">
//                     <Trophy className="w-4 h-4 mr-2" />
//                     LIVE
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Challenges
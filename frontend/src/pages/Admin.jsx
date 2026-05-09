// // src/pages/Admin.jsx
// import React, { useState, useEffect } from 'react'
// import { useLocation, useNavigate } from 'react-router-dom'
// import { 
//   BarChart3, 
//   Flag, 
//   Users, 
//   Settings as SettingsIcon,
//   Download,
//   Eye,
//   Edit3,
//   Trash2,
//   Shield,
//   Zap,
//   AlertTriangle,
//   Terminal
// } from 'lucide-react'
// import CreateChallengeForm from '../components/challenges/CreateChallengeForm'
// import AdminStats from '../components/stats/AdminStats'
// import axios from 'axios'

// const Admin = () => {
//   const location = useLocation()
//   const navigate = useNavigate()
//   const [activeTab, setActiveTab] = useState('stats')
//   const [challenges, setChallenges] = useState([])
//   const [users, setUsers] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [terminalOutput, setTerminalOutput] = useState([])
//   const [systemStatus, setSystemStatus] = useState({
//     database: 'ONLINE',
//     auth: 'SECURE',
//     challenges: 'ACTIVE',
//     submissions: 'LIVE'
//   })

//   // Determine active tab from URL
//   useEffect(() => {
//     const path = location.pathname
//     if (path.includes('/admin/users')) setActiveTab('users')
//     else if (path.includes('/admin/challenges')) setActiveTab('challenges')
//     else if (path.includes('/admin/settings')) setActiveTab('settings')
//     else setActiveTab('stats')
//   }, [location])

//   const addTerminalLine = (text, type = 'info') => {
//     setTerminalOutput(prev => [...prev, { 
//       text, 
//       type, 
//       timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
//     }])
//   }

//   useEffect(() => {
//     fetchData()
//     simulateSystemCheck()
//   }, [])

//   const simulateSystemCheck = () => {
//     addTerminalLine('Initializing system diagnostics...', 'system')
//     setTimeout(() => addTerminalLine('Database connection: ESTABLISHED', 'success'), 500)
//     setTimeout(() => addTerminalLine('Authentication system: SECURE', 'success'), 800)
//     setTimeout(() => addTerminalLine('Challenge service: ACTIVE', 'success'), 1100)
//     setTimeout(() => addTerminalLine('Submission handler: ONLINE', 'success'), 1400)
//   }

//   const fetchData = async () => {
//     try {
//       addTerminalLine('Accessing admin control panel...', 'system')
      
//       // Use mock data since API endpoints don't exist yet
//       const mockChallenges = [
//         {
//           id: 1,
//           title: 'SQL Injection Challenge',
//           description: 'Exploit SQL injection vulnerability to retrieve the flag',
//           category: 'web',
//           difficulty: 'easy',
//           points: 100,
//           solveCount: 15,
//           solved: false
//         },
//         {
//           id: 2,
//           title: 'Buffer Overflow',
//           description: 'Exploit buffer overflow to gain code execution',
//           category: 'pwn',
//           difficulty: 'hard',
//           points: 500,
//           solveCount: 3,
//           solved: false
//         },
//         {
//           id: 3,
//           title: 'RSA Challenge',
//           description: 'Break weak RSA implementation',
//           category: 'crypto',
//           difficulty: 'medium',
//           points: 250,
//           solveCount: 8,
//           solved: false
//         }
//       ]

//       const mockUsers = [
//         {
//           id: 1,
//           username: 'admin',
//           email: 'admin@cyberarena.com',
//           role: 'admin',
//           lastActive: new Date().toISOString(),
//           createdAt: new Date('2024-01-01').toISOString()
//         },
//         {
//           id: 2,
//           username: 'user1',
//           email: 'user1@example.com',
//           role: 'user',
//           lastActive: new Date(Date.now() - 86400000).toISOString(),
//           createdAt: new Date('2024-01-15').toISOString()
//         },
//         {
//           id: 3,
//           username: 'hacker42',
//           email: 'hacker42@protonmail.com',
//           role: 'user',
//           lastActive: new Date(Date.now() - 3600000).toISOString(),
//           createdAt: new Date('2024-02-01').toISOString()
//         }
//       ]

//       setChallenges(mockChallenges)
//       setUsers(mockUsers)
//       addTerminalLine(`Loaded ${mockChallenges.length} targets and ${mockUsers.length} users`, 'success')
      
//     } catch (error) {
//       addTerminalLine('WARNING: Using mock data - API endpoints not available', 'warning')
//       console.warn('API endpoints not available, using mock data:', error)
      
//       // Fallback to mock data
//       const mockChallenges = [
//         {
//           id: 1,
//           title: 'SQL Injection Challenge',
//           description: 'Exploit SQL injection vulnerability to retrieve the flag',
//           category: 'web',
//           difficulty: 'easy',
//           points: 100,
//           solveCount: 15
//         }
//       ]
      
//       const mockUsers = [
//         {
//           id: 1,
//           username: 'admin',
//           email: 'admin@cyberarena.com',
//           role: 'admin',
//           lastActive: new Date().toISOString(),
//           createdAt: new Date().toISOString()
//         }
//       ]
      
//       setChallenges(mockChallenges)
//       setUsers(mockUsers)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleChallengeCreated = () => {
//     addTerminalLine('New target deployed successfully', 'success')
//     fetchData()
//     navigate('/admin/challenges')
//   }

//   const handleExportData = () => {
//     addTerminalLine('Exporting system data...', 'system')
//     const data = {
//       challenges,
//       users,
//       exportedAt: new Date().toISOString()
//     }
//     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
//     const url = URL.createObjectURL(blob)
//     const link = document.createElement('a')
//     link.href = url
//     link.download = `ctf-export-${new Date().toISOString().split('T')[0]}.json`
//     link.click()
//     addTerminalLine('Data export completed', 'success')
//   }

//   const handleDeleteChallenge = (challengeId) => {
//     addTerminalLine(`Initiating target deletion: ${challengeId}`, 'warning')
//     setChallenges(prev => prev.filter(c => c.id !== challengeId))
//     addTerminalLine('Target successfully removed', 'success')
//   }

//   const getCategoryIcon = (category) => {
//     const icons = {
//       web: '🌐',
//       crypto: '🔑',
//       forensics: '🔍',
//       pwn: '💥',
//       reverse: '⚙️',
//       misc: '🐛'
//     }
//     return icons[category] || '🚩'
//   }

//   const getDifficultyColor = (difficulty) => {
//     switch (difficulty) {
//       case 'easy': return 'text-green-600 bg-green-50 border-green-200'
//       case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
//       case 'hard': return 'text-red-600 bg-red-50 border-red-200'
//       default: return 'text-gray-600 bg-gray-50 border-gray-200'
//     }
//   }

//     const renderTabContent = () => {
//     switch (activeTab) {
//       case 'stats':
//         return (
//           <div className="space-y-6">
//             <div className="flex items-center justify-between">
//               <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
//               <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg">
//                 <Shield className="w-4 h-4" />
//                 <span className="font-bold">Admin Access</span>
//               </div>
//             </div>
//             <AdminStats />
            
//             {/* Terminal Output */}
//             <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
//               <div className="flex items-center space-x-2 text-green-400 mb-3">
//                 <Terminal className="w-4 h-4" />
//                 <span className="text-sm font-medium">SYSTEM_LOG</span>
//               </div>
//               <div className="bg-black rounded p-3 h-32 overflow-y-auto">
//                 {terminalOutput.map((line, index) => (
//                   <div key={index} className={`text-sm ${
//                     line.type === 'error' ? 'text-red-400' :
//                     line.type === 'success' ? 'text-green-400' :
//                     line.type === 'warning' ? 'text-yellow-400' :
//                     line.type === 'system' ? 'text-blue-400' : 'text-gray-400'
//                   }`}>
//                     <span className="text-gray-500">[{line.timestamp}]</span> {line.text}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )
      
//       case 'challenges':
//         return (
//           <div className="space-y-6">
//             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Challenge Management</h1>
//                 <p className="text-gray-600">Manage CTF challenges and targets</p>
//               </div>
//               <button
//                 onClick={handleExportData}
//                 className="flex items-center space-x-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
//               >
//                 <Download className="w-4 h-4" />
//                 <span className="font-medium">Export Data</span>
//               </button>
//             </div>

//             <CreateChallengeForm onChallengeCreated={handleChallengeCreated} />
            
//             {/* Challenges List */}
//             <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
//               <div className="px-6 py-4 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900">Deployed Challenges</h3>
//                 <p className="text-gray-600 text-sm">Active challenge instances</p>
//               </div>
//               <div className="divide-y divide-gray-200">
//                 {challenges.map((challenge) => (
//                   <div key={challenge.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all group">
//                     <div className="flex-1">
//                       <div className="flex items-center space-x-4">
//                         <div className="text-2xl">
//                           {getCategoryIcon(challenge.category)}
//                         </div>
//                         <div className="flex-1">
//                           <div className="flex items-center space-x-3 mb-2">
//                             <h4 className="font-semibold text-gray-900 text-lg">{challenge.title}</h4>
//                             <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
//                               {challenge.difficulty.toUpperCase()}
//                             </span>
//                             <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium border border-blue-200">
//                               {challenge.points} PTS
//                             </span>
//                           </div>
//                           <p className="text-gray-600 text-sm">{challenge.description}</p>
//                           <div className="flex items-center space-x-4 mt-2">
//                             <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded border border-gray-200">
//                               {challenge.category.toUpperCase()}
//                             </span>
//                             <span className="text-yellow-600 text-xs">
//                               Solves: {challenge.solveCount || 0}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors border border-gray-300 rounded hover:border-blue-400">
//                         <Eye className="w-4 h-4" />
//                       </button>
//                       <button className="p-2 text-gray-400 hover:text-yellow-600 transition-colors border border-gray-300 rounded hover:border-yellow-400">
//                         <Edit3 className="w-4 h-4" />
//                       </button>
//                       <button 
//                         onClick={() => handleDeleteChallenge(challenge.id)}
//                         className="p-2 text-gray-400 hover:text-red-600 transition-colors border border-gray-300 rounded hover:border-red-400"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )
      
//       case 'users':
//         return (
//           <div className="space-y-6">
//             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
//                 <p className="text-gray-600">Manage system users and permissions</p>
//               </div>
//               <div className="flex space-x-3">
//                 <button className="flex items-center space-x-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all">
//                   <Download className="w-4 h-4" />
//                   <span className="font-medium">Export Users</span>
//                 </button>
//               </div>
//             </div>
            
//             <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
//               <div className="px-6 py-4 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900">Registered Users</h3>
//                 <p className="text-gray-600 text-sm">System access management</p>
//               </div>
//               <div className="divide-y divide-gray-200">
//                 {users.length > 0 ? (
//                   users.map((user) => (
//                     <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all">
//                       <div className="flex items-center space-x-4">
//                         <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
//                           {user.username?.charAt(0).toUpperCase()}
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-900 text-lg">{user.username}</h4>
//                           <p className="text-gray-600 text-sm">{user.email}</p>
//                           <div className="flex items-center space-x-2 mt-1">
//                             <span className={`px-2 py-1 rounded text-xs font-medium border ${
//                               user.role === 'admin' 
//                                 ? 'text-purple-600 bg-purple-50 border-purple-200' 
//                                 : 'text-green-600 bg-green-50 border-green-200'
//                             }`}>
//                               {user.role.toUpperCase()}
//                             </span>
//                             <span className="text-gray-500 text-xs">
//                               Last active: {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'N/A'}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="flex items-center space-x-4">
//                         <span className="text-gray-500 text-sm">
//                           Joined {new Date(user.createdAt).toLocaleDateString()}
//                         </span>
//                         <div className="flex items-center space-x-2">
//                           <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors border border-gray-300 rounded hover:border-blue-400">
//                             <Eye className="w-4 h-4" />
//                           </button>
//                           <button className="p-2 text-gray-400 hover:text-yellow-600 transition-colors border border-gray-300 rounded hover:border-yellow-400">
//                             <Edit3 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="px-6 py-12 text-center">
//                     <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//                     <p className="text-gray-500 text-lg">No Users Registered</p>
//                     <p className="text-gray-400 text-sm">System awaiting user registration</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )
      
//       case 'settings':
//         return (
//           <div className="space-y-6">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
//               <p className="text-gray-600">Manage platform settings and security</p>
//             </div>
            
//             <div className="grid gap-6">
//               {/* Competition Settings */}
//               <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
//                   <BarChart3 className="w-5 h-5 text-blue-600" />
//                   <span>Competition Settings</span>
//                 </h3>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Competition Name
//                     </label>
//                     <input
//                       type="text"
//                       className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
//                       placeholder="CTF Competition 2024"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Competition Description
//                     </label>
//                     <textarea
//                       className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
//                       rows="3"
//                       placeholder="Describe the competition objectives and rules..."
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Security Settings */}
//               <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
//                   <Shield className="w-5 h-5 text-green-600" />
//                   <span>Security Settings</span>
//                 </h3>
//                 <div className="space-y-3">
//                   <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 transition-all cursor-pointer">
//                     <input type="checkbox" className="rounded text-blue-600 border-gray-300" />
//                     <span className="text-gray-700 font-medium">Require Email Verification</span>
//                   </label>
//                   <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 transition-all cursor-pointer">
//                     <input type="checkbox" className="rounded text-blue-600 border-gray-300" />
//                     <span className="text-gray-700 font-medium">Enable Rate Limiting</span>
//                   </label>
//                   <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 transition-all cursor-pointer">
//                     <input type="checkbox" className="rounded text-blue-600 border-gray-300" />
//                     <span className="text-gray-700 font-medium">Log All Submissions</span>
//                   </label>
//                 </div>
//               </div>

//               {/* System Controls */}
//               <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
//                   <Zap className="w-5 h-5 text-yellow-600" />
//                   <span>System Controls</span>
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <button className="p-4 border border-green-200 text-green-700 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left">
//                     <div className="font-semibold">Backup System</div>
//                     <div className="text-sm text-green-600">Create system backup</div>
//                   </button>
//                   <button className="p-4 border border-blue-200 text-blue-700 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left">
//                     <div className="font-semibold">Update System</div>
//                     <div className="text-sm text-blue-600">Check for updates</div>
//                   </button>
//                 </div>
//               </div>

//               {/* Danger Zone */}
//               <div className="bg-red-50 border border-red-200 rounded-lg p-6">
//                 <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center space-x-2">
//                   <AlertTriangle className="w-5 h-5 text-red-600" />
//                   <span>Danger Zone</span>
//                 </h3>
//                 <p className="text-red-600 mb-4">Irreversible actions. Proceed with caution.</p>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <button className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold border border-red-600">
//                     Reset Competition
//                   </button>
//                   <button className="px-4 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold">
//                     Purge All Data
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )
      
//       default:
//         return null
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <div className="text-gray-600 font-medium">Loading Admin Interface...</div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {renderTabContent()}
//     </div>
//   )
// }


// export default Admin
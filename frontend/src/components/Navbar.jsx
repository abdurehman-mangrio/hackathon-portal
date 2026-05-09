// import React, { useState, useEffect } from 'react'
// import { Link, useLocation } from 'react-router-dom'
// import { 
//   Terminal, 
//   Cpu, 
//   Network, 
//   User, 
//   LogOut, 
//   Settings,
//   Shield,
//   Binary,
//   Server,
//   Scan
// } from 'lucide-react'
// import { useAuth } from '../contexts/AuthContext'

// const Navbar = () => {
//   const { user, logout, isAdmin } = useAuth()
//   const location = useLocation()
//   const [currentTime, setCurrentTime] = useState('')
//   const [isMenuOpen, setIsMenuOpen] = useState(false)

//   // Update current time in hacker format
//   useEffect(() => {
//     const updateTime = () => {
//       const now = new Date()
//       const timeString = now.toLocaleTimeString('en-US', {
//         hour12: false,
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit'
//       })
//       setCurrentTime(`[${timeString}]`)
//     }

//     updateTime()
//     const interval = setInterval(updateTime, 1000)
//     return () => clearInterval(interval)
//   }, [])

//   const navItems = [
//     { path: '/', label: 'SYSTEM_MAIN', icon: Terminal, command: 'cd ~' },
//     { path: '/challenges', label: 'CHALLENGES', icon: Cpu, command: './challenges --list' },
//     { path: '/leaderboard', label: 'RANKINGS', icon: Network, command: 'cat /var/log/rankings' },
//   ]

//   const isActive = (path) => location.pathname === path

//   return (
//     <nav className="fixed top-0 left-0 w-full z-50 bg-black/60 backdrop-blur-md">
//       <div className="container mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo and Main Navigation */}
//           <div className="flex items-center space-x-8">
//             {/* Terminal Logo */}
//             <Link to="/" className="flex items-center space-x-3 group">
//               <div className="relative">
//                 <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg flex items-center justify-center border border-green-400 group-hover:border-cyan-400 transition-all">
//                   <Terminal className="w-6 h-6 text-white" />
//                 </div>
//                 <div className="absolute -inset-1 bg-green-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
//               </div>
//               <div className="flex flex-col">
//                 <span className="text-lg font-bold text-white glitch" data-text="CYBER_ARENA">
//                   CYBER_ARENA
//                 </span>
//                 <span className="text-xs text-green-400">v2.1.4</span>
//               </div>
//             </Link>
            
//             {/* Main Navigation - Desktop */}
//             <div className="hidden md:flex space-x-2">
//               {navItems.map((item) => {
//                 const Icon = item.icon
//                 return (
//                   <Link
//                     key={item.path}
//                     to={item.path}
//                     className={`group flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
//                       isActive(item.path)
//                         ? 'border-cyan-400 bg-cyan-500 bg-opacity-10 text-cyan-400 shadow-lg shadow-cyan-500/20'
//                         : 'border-green-500 text-green-400 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-500 hover:bg-opacity-5'
//                     }`}
//                   >
//                     <Icon className="w-4 h-4" />
//                     <span className="text-sm font-bold">{item.label}</span>
//                     <div className="hidden group-hover:block absolute top-full mt-2 bg-black border border-green-500 rounded px-2 py-1 text-xs text-green-400">
//                       {item.command}
//                     </div>
//                   </Link>
//                 )
//               })}
//             </div>
//           </div>

//           {/* System Status and User Menu */}
//           <div className="flex items-center space-x-4">
//             {/* System Status */}
//             <div className="hidden lg:flex items-center space-x-4 text-xs">
//               <div className="flex items-center space-x-2 text-green-400">
//                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                 <span>ONLINE</span>
//               </div>
//               <div className="text-cyan-400 border border-cyan-500 rounded px-2 py-1 bg-cyan-500 bg-opacity-10">
//                 {currentTime}
//               </div>
//             </div>

//             {user ? (
//               <>
//                 {/* Admin Access */}
//                 {isAdmin && (
//                   <Link
//                     to="/admin"
//                     className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
//                       isActive('/admin')
//                         ? 'border-yellow-400 bg-yellow-500 bg-opacity-10 text-yellow-400'
//                         : 'border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:bg-opacity-5'
//                     }`}
//                   >
//                     <Shield className="w-4 h-4" />
//                     <span className="text-sm font-bold">ROOT_ACCESS</span>
//                   </Link>
//                 )}
                
//                 {/* User Info */}
//                 <div className="hidden md:flex items-center space-x-3 border border-green-500 rounded-lg px-4 py-2 bg-green-500 bg-opacity-5">
//                   <User className="w-4 h-4 text-green-400" />
//                   <div className="flex flex-col">
//                     <span className="text-sm font-bold text-white">{user.username}</span>
//                     <span className="text-xs text-green-400">USER_ACTIVE</span>
//                   </div>
//                 </div>
                
//                 {/* Mobile Menu Button */}
//                 <div className="md:hidden">
//                   <button
//                     onClick={() => setIsMenuOpen(!isMenuOpen)}
//                     className="p-2 border border-green-500 rounded-lg text-green-400 hover:text-cyan-400 hover:border-cyan-400 transition-all"
//                   >
//                     <Scan className="w-5 h-5" />
//                   </button>
//                 </div>

//                 {/* Logout - Desktop */}
//                 <button
//                   onClick={logout}
//                   className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:bg-opacity-10 hover:border-red-400 transition-all group"
//                 >
//                   <LogOut className="w-4 h-4" />
//                   <span className="text-sm font-bold">LOGOUT</span>
//                   <div className="hidden group-hover:block absolute top-full mt-2 bg-black border border-red-500 rounded px-2 py-1 text-xs text-red-400">
//                     kill -9 $$
//                   </div>
//                 </button>
//               </>
//             ) : (
//               <div className="flex space-x-3">
//                 <Link
//                   to="/login"
//                   className="px-4 py-2 text-sm font-bold border border-green-500 text-green-400 rounded-lg hover:border-cyan-400 hover:text-cyan-400 transition-all"
//                 >
//                   AUTHENTICATE
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-green-600 to-cyan-600 text-white rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all transform hover:scale-105 border border-green-400 shadow-lg shadow-green-500/25"
//                 >
//                   INIT_ACCESS
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {isMenuOpen && user && (
//           <div className="md:hidden border-t border-green-500 py-4 space-y-3 bg-black bg-opacity-95">
//             {/* Admin Mobile */}
//             {isAdmin && (
//               <Link
//                 to="/admin"
//                 onClick={() => setIsMenuOpen(false)}
//                 className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all ${
//                   isActive('/admin')
//                     ? 'border-yellow-400 bg-yellow-500 bg-opacity-10 text-yellow-400'
//                     : 'border-yellow-500 text-yellow-400'
//                 }`}
//               >
//                 <Shield className="w-4 h-4" />
//                 <span className="font-bold">ROOT_ACCESS</span>
//               </Link>
//             )}
            
//             {/* User Info Mobile */}
//             <div className="flex items-center space-x-3 px-4 py-3 border border-green-500 rounded-lg bg-green-500 bg-opacity-5">
//               <User className="w-4 h-4 text-green-400" />
//               <div className="flex flex-col">
//                 <span className="text-sm font-bold text-white">{user.username}</span>
//                 <span className="text-xs text-green-400">SESSION_ACTIVE</span>
//               </div>
//             </div>

//             {/* Logout Mobile */}
//             <button
//               onClick={() => {
//                 logout()
//                 setIsMenuOpen(false)
//               }}
//               className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:bg-opacity-10 transition-all"
//             >
//               <LogOut className="w-4 h-4" />
//               <span className="font-bold">TERMINATE_SESSION</span>
//             </button>
//           </div>
//         )}
//       </div>

//       <style jsx>{`
//         .glitch {
//           position: relative;
//         }
        
//         .glitch::before,
//         .glitch::after {
//           content: attr(data-text);
//           position: absolute;
//           top: 0;
//           left: 0;
//           width: 100%;
//           height: 100%;
//         }
        
//         .glitch::before {
//           animation: glitch-1 2s infinite linear alternate-reverse;
//           color: #ff00ff;
//           z-index: -1;
//         }
        
//         .glitch::after {
//           animation: glitch-2 3s infinite linear alternate-reverse;
//           color: #00ffff;
//           z-index: -2;
//         }
        
//         @keyframes glitch-1 {
//           0% { transform: translate(0); }
//           20% { transform: translate(-1px, 1px); }
//           40% { transform: translate(-1px, -1px); }
//           60% { transform: translate(1px, 1px); }
//           80% { transform: translate(1px, -1px); }
//           100% { transform: translate(0); }
//         }
        
//         @keyframes glitch-2 {
//           0% { transform: translate(0); }
//           20% { transform: translate(1px, -1px); }
//           40% { transform: translate(1px, 1px); }
//           60% { transform: translate(-1px, -1px); }
//           80% { transform: translate(-1px, 1px); }
//           100% { transform: translate(0); }
//         }
//       `}</style>
//     </nav>
//   )
// }

// export default Navbar
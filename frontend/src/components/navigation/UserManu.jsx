// src/components/navigation/UserMenu.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Terminal,
  LogOut, 
  User, 
  Settings, 
  Award,
  Shield,
  BookOpen,
  Users,
  Calendar,
  FileText,
  Home,
  BarChart3,
  Trophy,
  Cpu,
  Zap,
  Eye
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    // Update current time
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      clearInterval(interval)
    }
  }, [])

  const menuItems = [
    { 
      icon: BarChart3, 
      label: 'DASHBOARD', 
      command: 'cd /dashboard',
      path: '/dashboard',
      color: 'text-cyan-400'
    },
    { 
      icon: User, 
      label: 'USER_PROFILE', 
      command: 'whoami',
      path: '/dashboard/profile',
      color: 'text-blue-400'
    },
    { 
      icon: Trophy, 
      label: 'ACHIEVEMENTS', 
      command: 'cat /var/log/achievements',
      path: '/dashboard/achievements',
      color: 'text-yellow-400'
    },
    { 
      icon: Cpu, 
      label: 'CHALLENGES', 
      command: './challenge_loader',
      path: '/dashboard/challenges',
      color: 'text-green-400'
    },
    { 
      icon: FileText, 
      label: 'WRITEUPS', 
      command: 'vim solutions/',
      path: '/dashboard/writeups',
      color: 'text-purple-400'
    },
    { 
      icon: Users, 
      label: 'TEAM', 
      command: 'ssh team@collab',
      path: '/dashboard/team',
      color: 'text-orange-400'
    },
    { 
      icon: Calendar, 
      label: 'EVENTS', 
      command: './event_monitor',
      path: '/dashboard/events',
      color: 'text-pink-400'
    },
    { 
      icon: Settings, 
      label: 'SETTINGS', 
      command: 'nano ~/.config',
      path: '/dashboard/settings',
      color: 'text-gray-400'
    },
  ]

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { text: 'ROOT_ACCESS', color: 'text-red-400 border-red-500 bg-red-500 bg-opacity-10' }
      case 'moderator':
        return { text: 'ELEVATED_ACCESS', color: 'text-orange-400 border-orange-500 bg-orange-500 bg-opacity-10' }
      case 'user':
        return { text: 'STANDARD_ACCESS', color: 'text-green-400 border-green-500 bg-green-500 bg-opacity-10' }
      default:
        return { text: 'GUEST_ACCESS', color: 'text-gray-400 border-gray-500 bg-gray-500 bg-opacity-10' }
    }
  }

  const handleNavigation = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  const handleAdminNavigation = () => {
    navigate('/admin')
    setIsOpen(false)
  }

  const roleBadge = getRoleBadge(user?.role)

  // Get user stats
  const getUserStats = () => {
    return {
      points: user?.points || 0,
      level: user?.level || 1,
      rank: user?.rank || 'N/A',
      solved: user?.solvedChallenges || 0,
      achievements: user?.achievementsCount || 0
    }
  }

  const stats = getUserStats()

  return (
    <div className="relative font-mono" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg border border-green-500 hover:border-cyan-400 hover:bg-cyan-500 hover:bg-opacity-5 transition-all group backdrop-blur-sm bg-black bg-opacity-50"
      >
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white border-opacity-20">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
        </div>
        
        <div className="text-left hidden lg:block">
          <p className="text-sm font-bold text-white">{user?.username}</p>
          <p className="text-xs text-green-400 flex items-center space-x-1">
            <span>Lvl {stats.level}</span>
            <span>•</span>
            <span>{stats.points} pts</span>
          </p>
        </div>

        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <div className="text-green-400 text-xs">▼</div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-green-500 rounded-lg shadow-2xl shadow-green-500/20 py-2 z-50 overflow-hidden backdrop-blur-sm">
          {/* Terminal Header */}
          <div className="flex items-center space-x-2 p-3 border-b border-green-500/30 bg-black bg-opacity-50">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-green-400 text-xs ml-2 flex-1">user@{user?.username}:~</div>
            <div className="text-gray-500 text-xs">{currentTime}</div>
          </div>

          {/* User Info Section */}
          <div className="p-4 border-b border-green-500/30">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white border-opacity-20">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{user?.username}</p>
                <p className="text-green-300 text-xs">{user?.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs border ${roleBadge.color}`}>
                    {roleBadge.text}
                  </span>
                  <span className="text-cyan-400 text-xs bg-cyan-500 bg-opacity-10 px-2 py-0.5 rounded border border-cyan-500">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-black border border-green-500 rounded p-2 text-center">
                <div className="text-green-300">LEVEL</div>
                <div className="text-white font-bold">{stats.level}</div>
              </div>
              <div className="bg-black border border-green-500 rounded p-2 text-center">
                <div className="text-green-300">POINTS</div>
                <div className="text-white font-bold">{stats.points}</div>
              </div>
              <div className="bg-black border border-green-500 rounded p-2 text-center">
                <div className="text-green-300">SOLVED</div>
                <div className="text-white font-bold">{stats.solved}</div>
              </div>
              <div className="bg-black border border-green-500 rounded p-2 text-center">
                <div className="text-green-300">RANK</div>
                <div className="text-white font-bold">#{stats.rank}</div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="py-2 max-h-96 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-green-500 hover:bg-opacity-10 transition-all group border-b border-gray-800 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-white font-bold">{item.label}</span>
                  </div>
                  <div className="text-green-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.command}
                  </div>
                </button>
              )
            })}

            {/* Admin Access */}
            {isAdmin && (
              <button
                onClick={handleAdminNavigation}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-yellow-500 hover:bg-opacity-10 transition-all group border-t border-yellow-500 border-opacity-30 border-b border-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">ADMIN_PANEL</span>
                </div>
                <div className="text-yellow-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  sudo ./admin_panel
                </div>
              </button>
            )}

            {/* Home Navigation */}
            <button
              onClick={() => handleNavigation('/')}
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-blue-500 hover:bg-opacity-10 transition-all group border-b border-gray-800"
            >
              <div className="flex items-center space-x-3">
                <Home className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-bold">RETURN_HOME</span>
              </div>
              <div className="text-blue-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                cd /home
              </div>
            </button>
          </div>

          {/* Logout Section */}
          <div className="border-t border-red-500 border-opacity-30 pt-2">
            <button
              onClick={() => {
                logout()
                setIsOpen(false)
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-red-500 hover:bg-opacity-10 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold">TERMINATE_SESSION</span>
              </div>
              <div className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                kill -9 $$
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-green-500 border-opacity-30 bg-black bg-opacity-50">
            <div className="flex items-center justify-between text-xs text-green-600">
              <span>SESSION_ACTIVE</span>
              <span>CyberArena v2.1.4</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu
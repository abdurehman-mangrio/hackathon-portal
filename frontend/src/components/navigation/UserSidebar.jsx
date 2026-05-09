// src/components/navigation/UserSidebar.jsx
import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home,
  User,
  Settings,
  Award,
  Terminal,
  Users,
  Calendar,
  FileText,
  LogOut,
  Shield
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const UserSidebar = () => {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/dashboard/profile', label: 'Profile', icon: User },
    { path: '/dashboard/challenges', label: 'Challenges', icon: Terminal },
    { path: '/dashboard/achievements', label: 'Achievements', icon: Award },
    { path: '/dashboard/writeups', label: 'Writeups', icon: FileText },
    { path: '/dashboard/team', label: 'Team', icon: Users },
    { path: '/dashboard/events', label: 'Events', icon: Calendar },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Cyber Arena</h1>
            <p className="text-sm text-gray-500">User Panel</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="bg-gray-50 rounded p-2">
            <p className="text-sm font-bold text-gray-900">{user?.points || 0}</p>
            <p className="text-xs text-gray-500">Points</p>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <p className="text-sm font-bold text-gray-900">#{user?.rank || 'N/A'}</p>
            <p className="text-xs text-gray-500">Rank</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors"
          >
            <Shield className="w-5 h-5 mr-3" />
            Admin Panel
          </Link>
        )}
        
        <Link
          to="/"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Home className="w-5 h-5 mr-3" />
          Back to Home
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default UserSidebar
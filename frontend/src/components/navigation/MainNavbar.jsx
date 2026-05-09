// src/components/navigation/MainNavbar.jsx
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Terminal, 
  Cpu, 
  Trophy,
  User, 
  LogOut,
  Shield,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const MainNavbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { path: '/', label: 'Home', icon: Terminal },
    { path: '/challenges', label: 'Challenges', icon: Cpu },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrollY > 50 
        ? 'bg-gray-900/95 backdrop-blur-lg border-b border-gray-700' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight">
                CyberArena
              </span>
              <span className="text-xs text-gray-400">Professional Edition</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/25'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* User Actions */}
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
                  >
                    Go to Dashboard
                  </Link>
                  
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:bg-opacity-10 transition-all"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Admin</span>
                    </Link>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && user && (
          <div className="lg:hidden border-t border-gray-700 py-4 space-y-2 bg-gray-900/95 backdrop-blur-lg">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'text-white bg-blue-600'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
            
            <div className="pt-4 border-t border-gray-700 space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium"
              >
                <User className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </Link>
              
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg border border-yellow-500 text-yellow-400"
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default MainNavbar
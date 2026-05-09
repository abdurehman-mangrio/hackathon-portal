import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    security: true,
    system: true
  });

  const navigation = {
  content: {
    name: 'Content Management',
    icon: '📚',
    items: [
      { name: 'Dashboard', href: '/admin', icon: '📊' },
      { name: 'Users', href: '/admin/users', icon: '👥' },
      { name: 'Teams', href: '/admin/teams', icon: '👨‍👩‍👧‍👦' }, // NEW
      { name: 'Challenges', href: '/admin/challenges', icon: '🎯' },
      { name: 'Events', href: '/admin/events', icon: '📅' },
      { name: 'Achievements', href: '/admin/achievements', icon: '🏆' }, // NEW
      { name: 'Writeups', href: '/admin/writeups', icon: '📝' }, // NEW
    ]
  },
  security: {
    name: 'Security',
    icon: '🛡️',
    items: [
      { name: 'Security Dashboard', href: '/admin/security', icon: '📊' },
      { name: 'System Logs', href: '/admin/logs', icon: '📋' },
      { name: 'Session Monitor', href: '/admin/sessions', icon: '🔍' }, // NEW
    ]
  },
  system: {
    name: 'System',
    icon: '⚙️',
    items: [
      { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
      { name: 'Backups', href: '/admin/backups', icon: '💾' },
      { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
      { name: 'File Manager', href: '/admin/files', icon: '📁' }, // NEW
    ]
  }
};
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className={`relative transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Sidebar Container */}
      <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 shadow-xl">
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700 bg-gray-900">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  Admin Panel
                </h2>
                <p className="text-xs text-gray-400 leading-tight">
                  {user?.role === 'admin' ? 'Administrator' : 'Moderator'}
                </p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg mx-auto">
              <span className="text-white text-sm font-bold">A</span>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 border border-gray-600 hover:border-gray-500 ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7" 
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {Object.entries(navigation).map(([key, section]) => (
            <div key={key} className="space-y-1">
              {/* Section Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(key)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-gray-300 rounded-lg hover:bg-gray-750 hover:text-white transition-all duration-200 group"
                >
                  <span className="flex items-center">
                    <span className="mr-3 text-base">{section.icon}</span>
                    {section.name}
                  </span>
                  <span className={`transform transition-transform duration-200 text-xs ${
                    expandedSections[key] ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </button>
              )}

              {isCollapsed && (
                <div className="flex justify-center py-2.5">
                  <div className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-gray-750 transition-colors duration-200">
                    {section.icon}
                  </div>
                </div>
              )}

              {/* Section Items */}
              {!isCollapsed && expandedSections[key] && (
                <div className="ml-2 space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) => 
                        `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-400 hover:bg-gray-750 hover:text-white hover:shadow-md'
                        }`
                      }
                    >
                      <span className="mr-3 text-base">{item.icon}</span>
                      <span className="flex-1">{item.name}</span>
                      
                      {/* Active indicator */}
                      {isActive(item.href) && (
                        <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}

              {/* Collapsed Tooltips */}
              {isCollapsed && (
                <div className="relative">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) => 
                        `flex justify-center py-2.5 mx-2 my-1 rounded-lg transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-400 hover:bg-gray-750 hover:text-white'
                        }`
                      }
                      title={item.name}
                    >
                      <span className="text-base">{item.icon}</span>
                      
                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                        {item.name}
                      </div>
                      
                      {/* Active indicator */}
                      {isActive(item.href) && (
                        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full"></div>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Info & Actions */}
        <div className="p-3 border-t border-gray-700 space-y-3 bg-gray-850">
          {!isCollapsed ? (
            <>
              {/* Expanded User Info */}
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/50">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <NavLink
                  to="/dashboard"
                  className="flex items-center justify-center px-3 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 hover:shadow-md border border-gray-600 hover:border-gray-500 group"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to App
                </NavLink>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-medium text-red-300 bg-red-900/20 rounded-lg hover:bg-red-900/40 hover:text-red-200 transition-all duration-200 hover:shadow-md border border-red-800 hover:border-red-700 group"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Collapsed User Info */}
              <div className="flex justify-center p-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <NavLink
                  to="/dashboard"
                  className="flex justify-center py-2.5 mx-2 rounded-lg text-gray-400 hover:bg-gray-750 hover:text-white transition-all duration-200 group relative"
                  title="Back to App"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>

                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                    Back to App
                  </div>
                </NavLink>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="flex justify-center py-2.5 mx-2 rounded-lg text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all duration-200 group relative"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>

                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                    Logout
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overlay for mobile (optional) */}
      {!isCollapsed && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />
      )}
    </div>
  );
};

export default AdminSidebar;
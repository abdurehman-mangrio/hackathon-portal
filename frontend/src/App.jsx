import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ChallengeProvider } from './contexts/ChallengeContext.jsx'
import { SocketProvider } from './contexts/SocketContext.jsx'
import LoadingSpinner from './components/ui/LoadingSpinner.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'

// Layout Components
import MainLayout from './layouts/MainLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import UserLayout from './layouts/UserLayout.jsx'
import TeamLayout from './layouts/TeamLayout.jsx'

// Public Page Components
import Home from './pages/Home.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

// User Page Components
import UserDashboard from './pages/user/Dashboard.jsx'
import UserProfile from './pages/user/Profile.jsx'
import UserChallenges from './pages/user/Challenges.jsx'
import UserAchievements from './pages/user/Achievements.jsx'
import UserSettings from './pages/user/Settings.jsx'
import UserWriteups from './pages/user/Writeups.jsx'
import UserTeam from './pages/user/Team.jsx'
import UserEvents from './pages/user/Events.jsx'

// Admin Page Components
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminUserManagement from './pages/admin/UserManagement.jsx'
import AdminChallengeManagement from './pages/admin/ChallengeManagement.jsx'
import AdminAnalytics from './pages/admin/Analytics.jsx'
import AdminSystemSettings from './pages/admin/SystemSettings.jsx'
import AdminSecurityDashboard from './pages/admin/AdminSecurityDashboard.jsx'
import AdminEvents from './pages/admin/Events.jsx'
import AdminBackupManagement from './pages/admin/BackupManagement.jsx'
import AdminSystemLogs from './pages/admin/SystemLogs.jsx'

// NEW: Missing Admin Pages
import AdminTeamManagement from './pages/admin/TeamManagement.jsx'
import AdminAchievementManagement from './pages/admin/AchievementManagement.jsx'
import AdminWriteupManagement from './pages/admin/WriteupManagement.jsx'
import AdminSessionMonitor from './pages/admin/SessionMonitor.jsx'
import AdminFileManager from './pages/admin/FileManager.jsx'

// Protected Route Components
const UserRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect admin users away from user panel
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect regular users away from admin panel
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (user) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    } else {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

// Inner App component that uses the auth context
function AppContent() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          {/* Public Routes with Main Layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route 
              path="login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
          </Route>

          {/* User Routes with User Layout - ONLY for regular users */}
          <Route 
            path="/dashboard" 
            element={
              <UserRoute>
                <UserLayout />
              </UserRoute>
            }
          >
            <Route index element={<UserDashboard />} />
            <Route path="challenges" element={<UserChallenges />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="achievements" element={<UserAchievements />} />
            <Route path="settings" element={<UserSettings />} />
            <Route path="writeups" element={<UserWriteups />} />
            <Route path="team" element={<UserTeam />} />
            <Route path="events" element={<UserEvents />} />
          </Route>

          {/* Team Routes with Team Layout - ONLY for regular users */}
          <Route 
            path="/team" 
            element={
              <UserRoute>
                <TeamLayout />
              </UserRoute>
            }
          >
            <Route index element={<UserTeam />} />
            <Route path="manage" element={<UserTeam />} />
          </Route>

          {/* Admin Routes with Admin Layout - ONLY for admin users */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="teams" element={<AdminTeamManagement />} />
            <Route path="challenges" element={<AdminChallengeManagement />} />
            <Route path="achievements" element={<AdminAchievementManagement />} />
            <Route path="writeups" element={<AdminWriteupManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSystemSettings />} />
            <Route path="security" element={<AdminSecurityDashboard />} />
            <Route path="sessions" element={<AdminSessionMonitor />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="backups" element={<AdminBackupManagement />} />
            <Route path="logs" element={<AdminSystemLogs />} />
            <Route path="files" element={<AdminFileManager />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

// Main App component that provides all contexts
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ChallengeProvider>
              <AppContent />
            </ChallengeProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
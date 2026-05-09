import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Configure axios base URL - FIXED: use import.meta.env instead of process.env
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const userData = JSON.parse(localStorage.getItem('userData'))
        setUser(userData)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('userData', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  // Frontend-only demo login (no backend call required)
  const demoLogin = async ({ email, password }) => {
    const DEMO_ADMIN = { email: 'admin@hackathon.com', password: 'demo-admin' }
    const DEMO_USER = { email: 'user@hackathon.com', password: 'demo-user' }

    const isAdmin = email === DEMO_ADMIN.email && password === DEMO_ADMIN.password
    const isUser = email === DEMO_USER.email && password === DEMO_USER.password

    if (!isAdmin && !isUser) {
      return { success: false, error: 'Demo credentials not recognized' }
    }

    const userData = isAdmin
      ? { id: 'demo-admin', username: 'admin', email: DEMO_ADMIN.email, role: 'admin', score: 0 }
      : { id: 'demo-user', username: 'user', email: DEMO_USER.email, role: 'user', score: 0 }

    const demoToken = 'demo-token'
    localStorage.setItem('token', demoToken)
    localStorage.setItem('userData', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${demoToken}`
    setUser(userData)

    return { success: true, user: userData }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData)
      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('userData', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData)
    localStorage.setItem('userData', JSON.stringify(updatedUserData))
  }

  const isDemo = localStorage.getItem('token') === 'demo-token'

  const value = {
    user,
    login,
    demoLogin,
    register,
    logout,
    updateUser,
    loading,
    isAdmin: user?.role === 'admin',
    isDemo
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
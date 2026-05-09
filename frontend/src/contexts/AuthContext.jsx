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

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
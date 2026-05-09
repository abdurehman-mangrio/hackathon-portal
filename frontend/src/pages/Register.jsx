import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Terminal, 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield,
  Server,
  Key,
  Scan
} from 'lucide-react'

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState([])
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const addTerminalLine = (text, type = 'info') => {
    setTerminalOutput(prev => [...prev, { text, type, timestamp: new Date().toLocaleTimeString() }])
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setTerminalOutput([])
    
    addTerminalLine('Initializing user registration protocol...', 'system')
    addTerminalLine('Validating input parameters...', 'system')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      addTerminalLine('ERROR: Password verification failed - mismatch detected', 'error')
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      addTerminalLine('ERROR: Password strength insufficient - minimum 6 characters required', 'error')
      setError('Password must be at least 6 characters long')
      return
    }

    if (formData.username.length < 3) {
      addTerminalLine('ERROR: Username validation failed - minimum 3 characters required', 'error')
      setError('Username must be at least 3 characters long')
      return
    }

    addTerminalLine('All validations passed. Establishing secure connection...', 'success')
    setLoading(true)

    const { confirmPassword, ...registerData } = formData
    const result = await register(registerData)
    
    if (result.success) {
      addTerminalLine('User account created successfully!', 'success')
      addTerminalLine('Granting system access...', 'system')
      addTerminalLine('Redirecting to challenge interface...', 'system')
      setTimeout(() => navigate('/challenges'), 1500)
    } else {
      addTerminalLine(`ERROR: Registration failed - ${result.error}`, 'error')
      setError(result.error)
    }
    
    setLoading(false)
  }

  const passwordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '', color: 'bg-gray-500' }
    if (password.length < 6) return { strength: 1, label: 'CRITICAL', color: 'bg-red-500' }
    if (password.length < 8) return { strength: 2, label: 'WEAK', color: 'bg-orange-500' }
    if (password.length < 10) return { strength: 3, label: 'SECURE', color: 'bg-yellow-500' }
    return { strength: 4, label: 'STRONG', color: 'bg-green-500' }
  }

  const strength = passwordStrength(formData.password)

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono relative">
      {/* Matrix Background */}
      <div className="fixed inset-0 bg-black opacity-90 z-0">
        <div className="matrix-rain"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4">
        <div className="max-w-2xl w-full space-y-8">
          {/* Terminal Header */}
          <div className="bg-black border border-green-500 rounded-lg shadow-2xl shadow-green-500/20">
            <div className="flex items-center space-x-2 p-4 border-b border-green-500/30">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="text-green-400 text-sm ml-2">cyber-arena.ctf -- user_registration</div>
            </div>
            
            <div className="p-6">
              {/* System Header */}
              <div className="flex items-center space-x-2 text-green-300 mb-6">
                <Terminal className="w-5 h-5" />
                <span className="text-sm">SYSTEM_REGISTRATION_PROTOCOL</span>
              </div>

              {/* Terminal Output */}
              <div className="bg-black border border-green-500 rounded-lg p-4 mb-6 h-32 overflow-y-auto">
                {terminalOutput.map((line, index) => (
                  <div key={index} className={`text-sm ${
                    line.type === 'error' ? 'text-red-400' :
                    line.type === 'success' ? 'text-green-400' :
                    line.type === 'system' ? 'text-cyan-400' : 'text-green-300'
                  }`}>
                    <span className="text-gray-500">[{line.timestamp}]</span> {line.text}
                  </div>
                ))}
                {terminalOutput.length === 0 && (
                  <div className="text-gray-500 text-sm">
                    [SYSTEM] Waiting for registration sequence initiation...
                  </div>
                )}
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg font-mono text-sm">
                    <span className="text-red-400">[ERROR]</span> {error}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-bold text-green-400 mb-2">
                      [IDENTITY] FULL_NAME
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 transition-all font-mono"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-bold text-green-400 mb-2">
                      [ACCESS] USERNAME
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        minLength={3}
                        className="w-full pl-10 pr-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 transition-all font-mono"
                        placeholder="Choose username"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-green-400 mb-2">
                    [CONTACT] EMAIL_ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 transition-all font-mono"
                      placeholder="user@domain.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-green-400 mb-2">
                    [SECURITY] ENCRYPTION_KEY
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 transition-all font-mono"
                      placeholder="Create encryption key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-green-400">SECURITY_LEVEL:</span>
                    <span className={`font-bold ${
                      strength.strength === 1 ? 'text-red-400' :
                      strength.strength === 2 ? 'text-orange-400' :
                      strength.strength === 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full ${
                          level <= strength.strength ? strength.color : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-green-400 mb-2">
                    [VERIFY] CONFIRM_KEY
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 transition-all font-mono"
                      placeholder="Verify encryption key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-cyan-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-3 p-4 bg-black border border-green-500 rounded-lg">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="w-4 h-4 text-green-500 bg-black border-green-500 rounded focus:ring-green-500 mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-green-300">
                    I acknowledge and agree to the{' '}
                    <Link to="/terms" className="text-cyan-400 hover:text-cyan-300 font-bold">
                      SYSTEM_TERMS
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300 font-bold">
                      SECURITY_PROTOCOLS
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-cyan-600 text-white py-4 px-6 rounded-lg hover:from-green-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold border border-cyan-400 shadow-lg shadow-cyan-500/25 relative group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-sm">INITIALIZING_ACCESS...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Shield className="w-5 h-5 mr-2" />
                      <span>EXECUTE_REGISTRATION</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 pt-6 border-t border-green-500 border-opacity-30">
                <p className="text-center text-green-300 text-sm">
                  Already have system access?{' '}
                  <Link
                    to="/login"
                    className="text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    INITIATE_AUTHENTICATION
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .matrix-rain {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(0,255,0,0.1) 0%, transparent 50%);
          opacity: 0.1;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

export default Register
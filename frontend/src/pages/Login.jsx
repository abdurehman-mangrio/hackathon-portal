import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Terminal, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Shield,
  User,
  Server,
  Scan,
  Key
} from 'lucide-react'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState([])
  const [accessAttempts, setAccessAttempts] = useState(0)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/challenges'

  useEffect(() => {
    // Initial terminal message
    addTerminalLine('Authentication system initialized...', 'system')
    addTerminalLine('Waiting for user credentials...', 'system')
  }, [])

  const addTerminalLine = (text, type = 'info') => {
    setTerminalOutput(prev => [...prev, { 
      text, 
      type, 
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    }])
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
    setLoading(true)
    setAccessAttempts(prev => prev + 1)

    addTerminalLine(`Access attempt #${accessAttempts + 1} initiated...`, 'system')
    addTerminalLine('Verifying user credentials...', 'system')

    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      addTerminalLine('Credentials verified successfully!', 'success')
      addTerminalLine('Granting system access...', 'system')
      addTerminalLine('Establishing secure session...', 'system')
      setTimeout(() => navigate(from, { replace: true }), 1500)
    } else {
      addTerminalLine(`AUTHENTICATION FAILED: ${result.error}`, 'error')
      addTerminalLine('Security protocol engaged...', 'system')
      setError(result.error)
    }
    
    setLoading(false)
  }

  const simulateIntrusionDetection = () => {
    addTerminalLine('Intrusion detection system activated...', 'warning')
    addTerminalLine('Scanning for security threats...', 'system')
    addTerminalLine('All systems secure.', 'success')
  }

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
              <div className="text-green-400 text-sm ml-2">cyber-arena.ctf -- authentication_gateway</div>
            </div>
            
            <div className="p-6">
              {/* System Header */}
              <div className="flex items-center space-x-2 text-green-300 mb-6">
                <Terminal className="w-5 h-5" />
                <span className="text-sm">SECURE_AUTHENTICATION_PROTOCOL</span>
              </div>

              {/* Terminal Output */}
              <div className="bg-black border border-green-500 rounded-lg p-4 mb-6 h-32 overflow-y-auto">
                {terminalOutput.map((line, index) => (
                  <div key={index} className={`text-sm ${
                    line.type === 'error' ? 'text-red-400' :
                    line.type === 'success' ? 'text-green-400' :
                    line.type === 'warning' ? 'text-yellow-400' :
                    line.type === 'system' ? 'text-cyan-400' : 'text-green-300'
                  }`}>
                    <span className="text-gray-500">[{line.timestamp}]</span> {line.text}
                  </div>
                ))}
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg font-mono text-sm">
                    <span className="text-red-400">[SECURITY BREACH]</span> {error}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-green-400 mb-2">
                    [IDENTITY] ACCESS_ID
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
                      placeholder="user@cyber-arena.io"
                    />
                  </div>
                </div>

                {/* Password Field */}
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
                      className="w-full pl-10 pr-12 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 transition-all font-mono"
                      placeholder="Enter encryption key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Security Options */}
                <div className="flex items-center justify-between p-4 bg-black border border-green-500 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-green-500 bg-black border-green-500 rounded focus:ring-green-500"
                    />
                    <label htmlFor="remember" className="text-sm text-green-300">
                      MAINTAIN_SESSION
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={simulateIntrusionDetection}
                    className="text-sm text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1"
                  >
                    <Scan className="w-4 h-4" />
                    <span>SYSTEM_SCAN</span>
                  </button>
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
                      <span className="text-sm">AUTHENTICATING...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Shield className="w-5 h-5 mr-2" />
                      <span>INITIATE_AUTHENTICATION</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Registration Link */}
              <div className="mt-6 pt-6 border-t border-green-500 border-opacity-30">
                <p className="text-center text-green-300 text-sm">
                  No system access?{' '}
                  <Link
                    to="/register"
                    className="text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    REQUEST_CLEARANCE
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Demo Credentials - Hacker Style */}
          <div className="bg-black border border-yellow-500 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-yellow-400 mb-3">
              <Key className="w-4 h-4" />
              <h3 className="text-sm font-bold">TEST_CREDENTIALS</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-green-400 font-mono">
                <span className="text-gray-500">ACCESS_ID:</span> admin@cyber-arena.io
              </div>
              <div className="text-green-400 font-mono">
                <span className="text-gray-500">ENCRYPTION_KEY:</span> Admin123!
              </div>
              <div className="text-cyan-400 text-xs mt-2">
                [PRIVILEGE_LEVEL: ROOT_ACCESS]
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-3 gap-4 text-xs text-center">
            <div className="bg-black border border-green-500 rounded p-3">
              <div className="text-green-400 font-bold">SECURE</div>
              <div className="text-gray-400">CONNECTION</div>
            </div>
            <div className="bg-black border border-cyan-500 rounded p-3">
              <div className="text-cyan-400 font-bold">ACTIVE</div>
              <div className="text-gray-400">SESSION</div>
            </div>
            <div className="bg-black border border-green-500 rounded p-3">
              <div className="text-green-400 font-bold">ENCRYPTED</div>
              <div className="text-gray-400">CHANNEL</div>
            </div>
          </div>
        </div>
      </div>

      {/* <style jsx>{`
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
        
        .blinking-cursor {
          animation: blink 1s infinite;
          color: #00ff00;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style> */}
    </div>
  )
}

export default Login
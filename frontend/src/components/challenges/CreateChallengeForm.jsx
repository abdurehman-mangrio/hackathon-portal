import React, { useState } from 'react'
import { 
  Terminal,
  Plus, 
  Code, 
  FileText, 
  Image, 
  Link,
  Upload,
  Server,
  Shield,
  Cpu,
  Network,
  Binary,
  FileSearch,
  Key,
  Bug,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import axios from 'axios'

const CreateChallengeForm = ({ onChallengeCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web',
    difficulty: 'easy',
    points: 100,
    flag: '',
    hint: '',
    files: []
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const [terminalOutput, setTerminalOutput] = useState([])
  const [showFlag, setShowFlag] = useState(false)

  const categories = [
    { value: 'web', label: 'WEB_EXPLOITATION', icon: Network, color: 'from-blue-500 to-cyan-500' },
    { value: 'crypto', label: 'CRYPTOGRAPHY', icon: Key, color: 'from-yellow-500 to-amber-500' },
    { value: 'forensics', label: 'DIGITAL_FORENSICS', icon: FileSearch, color: 'from-orange-500 to-red-500' },
    { value: 'pwn', label: 'BINARY_PWN', icon: Binary, color: 'from-purple-500 to-pink-500' },
    { value: 'reverse', label: 'REVERSE_ENGINEERING', icon: Cpu, color: 'from-green-500 to-emerald-500' },
    { value: 'misc', label: 'MISCELLANEOUS', icon: Bug, color: 'from-indigo-500 to-purple-500' }
  ]

  const difficulties = [
    { value: 'easy', label: 'BEGINNER', points: 100, color: 'text-green-400' },
    { value: 'medium', label: 'INTERMEDIATE', points: 250, color: 'text-yellow-400' },
    { value: 'hard', label: 'EXPERT', points: 500, color: 'text-red-400' }
  ]

  const addTerminalLine = (text, type = 'info') => {
    setTerminalOutput(prev => [...prev, { 
      text, 
      type, 
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    }])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-adjust points based on difficulty
    if (name === 'difficulty') {
      const difficulty = difficulties.find(d => d.value === value)
      if (difficulty) {
        setFormData(prev => ({
          ...prev,
          points: difficulty.points
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    addTerminalLine('Initializing challenge deployment protocol...', 'system')

    try {
      await axios.post('/admin/challenges', formData)
      const successMsg = 'TARGET_SUCCESSFULLY_DEPLOYED'
      setMessage(successMsg)
      addTerminalLine(successMsg, 'success')
      addTerminalLine(`Challenge "${formData.title}" added to active targets`, 'system')
      
      setFormData({
        title: '',
        description: '',
        category: 'web',
        difficulty: 'easy',
        points: 100,
        flag: '',
        hint: '',
        files: []
      })
      onChallengeCreated?.()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'DEPLOYMENT_FAILED: System error'
      setMessage(errorMsg)
      addTerminalLine(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'TARGET_SPECS', icon: FileText, command: './config_basic' },
    { id: 'advanced', label: 'SECURITY_PROTOCOLS', icon: Shield, command: './config_advanced' },
    { id: 'files', label: 'RESOURCE_FILES', icon: Download, command: './manage_files' }
  ]

  const generateFlag = () => {
    const flag = `CTF{${Math.random().toString(36).substr(2, 12).toUpperCase()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}}`
    setFormData(prev => ({ ...prev, flag }))
    addTerminalLine('Generated secure flag template', 'system')
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    addTerminalLine('Flag copied to clipboard', 'success')
  }

  const simulateFileUpload = () => {
    addTerminalLine('File upload simulation initiated...', 'system')
    setTimeout(() => addTerminalLine('File validation passed', 'success'), 1000)
    setTimeout(() => addTerminalLine('File encrypted and stored', 'success'), 1500)
  }

  return (
    <div className="bg-black border border-green-500 rounded-lg shadow-2xl shadow-green-500/20 p-6 font-mono">
      {/* Terminal Header */}
      <div className="flex items-center space-x-2 text-green-300 mb-6">
        <Terminal className="w-5 h-5" />
        <span className="text-sm">TARGET_DEPLOYMENT_SYSTEM</span>
      </div>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <Plus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white glitch" data-text="DEPLOY_NEW_TARGET">
            DEPLOY_NEW_TARGET
          </h2>
          <p className="text-green-300 text-sm">Create new challenge for operators</p>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-black border border-green-500 rounded-lg p-4 mb-6 h-24 overflow-y-auto">
        {terminalOutput.map((line, index) => (
          <div key={index} className={`text-sm ${
            line.type === 'error' ? 'text-red-400' :
            line.type === 'success' ? 'text-green-400' :
            line.type === 'system' ? 'text-cyan-400' : 'text-green-300'
          }`}>
            <span className="text-gray-500">[{line.timestamp}]</span> {line.text}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-green-500 mb-6">
        <nav className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm transition-all group relative ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500 bg-opacity-10'
                    : 'border-transparent text-green-400 hover:text-cyan-400 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <div className="hidden group-hover:block absolute top-full mt-2 bg-black border border-green-500 rounded px-2 py-1 text-xs text-green-400">
                  {tab.command}
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div className={`p-4 rounded-lg border font-mono text-sm ${
            message.includes('FAILED') 
              ? 'bg-red-500 bg-opacity-10 border-red-500 text-red-400' 
              : 'bg-green-500 bg-opacity-10 border-green-500 text-green-400'
          }`}>
            <div className="flex items-center space-x-2">
              {message.includes('FAILED') ? 
                <XCircle className="w-4 h-4" /> : 
                <CheckCircle className="w-4 h-4" />
              }
              <span className="font-bold">{message}</span>
            </div>
          </div>
        )}

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-green-400 mb-2">
                  [TARGET] CHALLENGE_TITLE
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 transition-all font-mono"
                  placeholder="ENTER_TARGET_NAME"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-green-400 mb-2">
                  [CATEGORY] OPERATION_TYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(category => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.category === category.value
                            ? 'border-cyan-400 bg-cyan-500 bg-opacity-10 text-cyan-400'
                            : 'border-green-500 text-green-400 hover:border-cyan-400 hover:bg-cyan-500 hover:bg-opacity-5'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-bold">{category.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-green-400 mb-2">
                  [DIFFICULTY] THREAT_LEVEL
                </label>
                <div className="space-y-2">
                  {difficulties.map(diff => (
                    <button
                      key={diff.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        difficulty: diff.value,
                        points: diff.points 
                      }))}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        formData.difficulty === diff.value
                          ? 'border-cyan-400 bg-cyan-500 bg-opacity-10 text-cyan-400'
                          : `${diff.color} border-green-500 hover:border-cyan-400`
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{diff.label}</span>
                        <span className="text-white">{diff.points} PTS</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-green-400 mb-2">
                  [REWARD] POINT_VALUE
                </label>
                <input
                  type="number"
                  name="points"
                  value={formData.points}
                  onChange={handleChange}
                  required
                  min="1"
                  max="1000"
                  className="w-full px-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white font-mono"
                />
                <div className="flex space-x-2 mt-2">
                  {[100, 250, 500].map(points => (
                    <button
                      key={points}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, points }))}
                      className="px-2 py-1 text-xs border border-green-500 text-green-400 rounded hover:border-cyan-400 hover:text-cyan-400"
                    >
                      {points}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-green-400 mb-2">
                [BRIEFING] MISSION_DESCRIPTION
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="6"
                className="w-full px-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 resize-vertical font-mono"
                placeholder="DESCRIBE_THE_OPERATION_OBJECTIVES_AND_REQUIREMENTS..."
              />
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-green-400">
                  [SECURITY] ENCRYPTION_FLAG
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={generateFlag}
                    className="px-3 py-1 border border-yellow-500 text-yellow-400 rounded text-sm hover:border-yellow-400 hover:text-yellow-300 transition-all"
                  >
                    GENERATE
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFlag(!showFlag)}
                    className="p-1 text-green-400 hover:text-cyan-400 transition-colors"
                  >
                    {showFlag ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {formData.flag && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.flag)}
                      className="p-1 text-green-400 hover:text-cyan-400 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <input
                type={showFlag ? "text" : "password"}
                name="flag"
                value={formData.flag}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 font-mono transition-all"
                placeholder="CTF{SECURE_FLAG_HERE}"
              />
              <p className="text-sm text-green-600 mt-2">
                Primary authentication token for target validation
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-green-400 mb-2">
                [INTEL] OPERATION_HINT
              </label>
              <textarea
                name="hint"
                value={formData.hint}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 bg-black border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-green-600 resize-vertical font-mono"
                placeholder="PROVIDE_TACTICAL_INTELLIGENCE_FOR_OPERATORS..."
              />
            </div>

            <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-400 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold">DEPLOYMENT_PROTOCOLS</h4>
              </div>
              <ul className="text-sm text-yellow-300 space-y-2 font-mono">
                <li className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Ensure flags are cryptographically secure</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Test all challenge components before deployment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Use CTF{'{'}...{'}'} format for consistency</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Server className="w-4 h-4" />
                  <span>Validate resource file integrity</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-green-500 rounded-lg p-8 text-center hover:border-cyan-400 transition-all group">
              <Download className="w-12 h-12 text-green-400 mx-auto mb-4 group-hover:text-cyan-400 transition-colors" />
              <p className="text-green-300 mb-4">Upload mission resource files</p>
              <button
                type="button"
                onClick={simulateFileUpload}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 text-white rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all border border-cyan-400 font-bold"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                SELECT_FILES
              </button>
              <p className="text-sm text-green-600 mt-3">
                MAXIMUM_PAYLOAD: 50MB PER FILE
              </p>
            </div>

            <div className="bg-cyan-500 bg-opacity-10 border border-cyan-500 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-cyan-400 mb-3">
                <FileText className="w-5 h-5" />
                <h4 className="font-bold">FILE_REQUIREMENTS</h4>
              </div>
              <ul className="text-sm text-cyan-300 space-y-2 font-mono">
                <li>• SUPPORTED_FORMATS: ZIP, PDF, EXE, PNG, JPG, TXT</li>
                <li>• MAXIMUM_TOTAL_PAYLOAD: 100MB</li>
                <li>• SCAN_FILES_FOR_MALWARE_BEFORE_UPLOAD</li>
                <li>• PROVIDE_CLEAR_USAGE_INSTRUCTIONS</li>
                <li>• ENCRYPT_SENSITIVE_FILES</li>
              </ul>
            </div>

            {/* File List Preview */}
            <div className="bg-black border border-green-500 rounded-lg p-4">
              <h4 className="text-green-400 font-bold mb-3">DEPLOYED_RESOURCES</h4>
              <div className="text-green-600 text-sm text-center py-4">
                NO_FILES_DEPLOYED
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t border-green-500 border-opacity-30">
          <button
            type="button"
            className="px-6 py-3 border border-green-500 text-green-400 rounded-lg hover:border-cyan-400 hover:text-cyan-400 transition-all font-bold"
          >
            SAVE_DRAFT
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 text-white rounded-lg hover:from-green-700 hover:to-cyan-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold border border-cyan-400 shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>DEPLOYING_TARGET...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>DEPLOY_CHALLENGE</span>
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .glitch {
          position: relative;
        }
        
        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .glitch::before {
          animation: glitch-1 0.5s infinite linear alternate-reverse;
          color: #ff00ff;
          z-index: -1;
        }
        
        .glitch::after {
          animation: glitch-2 0.5s infinite linear alternate-reverse;
          color: #00ffff;
          z-index: -2;
        }
        
        @keyframes glitch-1 {
          0% { transform: translate(0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(-1px, -1px); }
          60% { transform: translate(1px, 1px); }
          80% { transform: translate(1px, -1px); }
          100% { transform: translate(0); }
        }
        
        @keyframes glitch-2 {
          0% { transform: translate(0); }
          20% { transform: translate(1px, -1px); }
          40% { transform: translate(1px, 1px); }
          60% { transform: translate(-1px, -1px); }
          80% { transform: translate(-1px, 1px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  )
}

export default CreateChallengeForm
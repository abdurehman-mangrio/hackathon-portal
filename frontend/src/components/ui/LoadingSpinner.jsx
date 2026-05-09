// src/components/ui/LoadingSpinner.jsx
import React, { useState, useEffect } from 'react'
import { 
  Terminal, 
  Cpu, 
  Server, 
  Database, 
  Shield, 
  Zap,
  Activity,
  Binary,
  Network
} from 'lucide-react'

const LoadingSpinner = ({ message = "Initializing system..." }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [terminalLines, setTerminalLines] = useState([])
  const [currentLine, setCurrentLine] = useState('')

  const loadingSteps = [
    { 
      text: "BOOTING_SYSTEM_KERNEL", 
      icon: Cpu,
      command: "init 0x1A3F",
      duration: 800 
    },
    { 
      text: "LOADING_SECURITY_PROTOCOLS", 
      icon: Shield,
      command: "secure_boot --verify",
      duration: 1000 
    },
    { 
      text: "MOUNTING_CHALLENGE_DATABASE", 
      icon: Database,
      command: "mount /dev/sda1 /challenges",
      duration: 1200 
    },
    { 
      text: "ESTABLISHING_NETWORK_SOCKETS", 
      icon: Network,
      command: "netstat -tulpn | grep :1337",
      duration: 900 
    },
    { 
      text: "INITIALIZING_CRYPTO_SYSTEMS", 
      icon: Binary,
      command: "openssl rand -base64 32",
      duration: 1100 
    },
    { 
      text: "STARTING_AUTHENTICATION_DAEMON", 
      icon: Shield,
      command: "./auth_daemon --start",
      duration: 800 
    },
    { 
      text: "SYSTEM_READY", 
      icon: Zap,
      command: "systemctl status cyber-arena",
      duration: 500 
    }
  ]

  useEffect(() => {
    const totalDuration = loadingSteps.reduce((sum, step) => sum + step.duration, 0)
    let currentProgress = 0

    const progressInterval = setInterval(() => {
      currentProgress += 1
      setProgress(Math.min(currentProgress, 100))
    }, totalDuration / 100)

    // Simulate terminal output
    let stepIndex = 0
    const processSteps = () => {
      if (stepIndex < loadingSteps.length) {
        const step = loadingSteps[stepIndex]
        
        // Add new terminal line
        setTerminalLines(prev => [...prev, {
          text: step.text,
          command: step.command,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }])
        
        setCurrentStep(stepIndex)
        
        // Typewriter effect for current line
        let charIndex = 0
        const typeInterval = setInterval(() => {
          if (charIndex <= step.command.length) {
            setCurrentLine(step.command.slice(0, charIndex))
            charIndex++
          } else {
            clearInterval(typeInterval)
            setTimeout(() => {
              setCurrentLine('')
              stepIndex++
              processSteps()
            }, 500)
          }
        }, 30)

        return () => clearInterval(typeInterval)
      }
    }

    processSteps()

    return () => {
      clearInterval(progressInterval)
    }
  }, [])

  const CurrentIcon = loadingSteps[currentStep]?.icon || Activity

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono relative overflow-hidden">
      {/* Matrix Background Effect */}
      <div className="absolute inset-0 bg-black opacity-90 z-0">
        <div 
          className="w-full h-full opacity-10"
          style={{
            background: 'linear-gradient(180deg, rgba(0,255,0,0.1) 0%, transparent 50%)'
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full">
          {/* Terminal Header */}
          <div className="bg-black border border-green-500 rounded-lg shadow-2xl shadow-green-500/20 mb-6">
            <div className="flex items-center space-x-2 p-4 border-b border-green-500/30">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="text-green-400 text-sm ml-2">cyber-arena.ctf -- system_boot</div>
            </div>
            
            <div className="p-6">
              {/* System Header */}
              <div className="flex items-center space-x-2 text-green-300 mb-6">
                <Terminal className="w-5 h-5" />
                <span className="text-sm">SYSTEM_INITIALIZATION</span>
              </div>

              {/* Terminal Output */}
              <div className="bg-black border border-green-500 rounded-lg p-4 mb-6 h-48 overflow-y-auto">
                {terminalLines.map((line, index) => (
                  <div key={index} className="text-sm text-green-300 mb-2">
                    <span className="text-gray-500">[{line.timestamp}]</span>{' '}
                    <span className="text-cyan-400">[</span>
                    <span className="text-yellow-400">OK</span>
                    <span className="text-cyan-400">]</span>{' '}
                    {line.text}
                    <div className="text-green-400 ml-8 text-xs">
                      <span className="text-gray-500">$ </span>
                      {line.command}
                    </div>
                  </div>
                ))}
                
                {/* Current Typing Line */}
                {currentLine && (
                  <div className="text-sm text-green-400">
                    <span className="text-gray-500">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>{' '}
                    <span className="text-cyan-400">[</span>
                    <span className="text-yellow-400">EXEC</span>
                    <span className="text-cyan-400">]</span>{' '}
                    {loadingSteps[currentStep]?.text}
                    <div className="text-green-400 ml-8 text-xs">
                      <span className="text-gray-500">$ </span>
                      {currentLine}
                      <span className="animate-pulse">▋</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Section */}
              <div className="space-y-4">
                {/* Current Step */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <CurrentIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">
                        {loadingSteps[currentStep]?.text || "SYSTEM_READY"}
                      </div>
                      <div className="text-green-300 text-xs">
                        Step {currentStep + 1} of {loadingSteps.length}
                      </div>
                    </div>
                  </div>
                  <div className="text-cyan-400 font-bold text-lg">
                    {progress}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-4 gap-4 text-center text-xs">
                  <div>
                    <div className="text-green-300">KERNEL</div>
                    <div className="text-white font-bold">
                      {progress > 15 ? 'LOADED' : '...'}
                    </div>
                  </div>
                  <div>
                    <div className="text-green-300">SECURITY</div>
                    <div className="text-white font-bold">
                      {progress > 35 ? 'ACTIVE' : '...'}
                    </div>
                  </div>
                  <div>
                    <div className="text-green-300">NETWORK</div>
                    <div className="text-white font-bold">
                      {progress > 65 ? 'ONLINE' : '...'}
                    </div>
                  </div>
                  <div>
                    <div className="text-green-300">AUTH</div>
                    <div className="text-white font-bold">
                      {progress > 85 ? 'READY' : '...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status Footer */}
          <div className="bg-black border border-cyan-500 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="text-green-300">BOOT_SEQUENCE</div>
                <div className="text-white font-bold">ACTIVE</div>
              </div>
              <div>
                <div className="text-green-300">MEMORY_USAGE</div>
                <div className="text-white font-bold">{Math.floor(progress * 2.56)}MB</div>
              </div>
              <div>
                <div className="text-green-300">CPU_LOAD</div>
                <div className="text-white font-bold">{Math.floor(progress * 0.8)}%</div>
              </div>
              <div>
                <div className="text-green-300">TIME_ELAPSED</div>
                <div className="text-white font-bold">0:{Math.floor(progress * 0.03).toString().padStart(2, '0')}s</div>
              </div>
            </div>
          </div>

          {/* Loading Message */}
          <div className="text-center mt-6">
            <div className="text-green-300 text-sm mb-2">{message}</div>
            <div className="flex items-center justify-center space-x-2 text-green-600 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>SECURE_CONNECTION_ESTABLISHED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner
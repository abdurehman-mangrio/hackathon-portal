import React from 'react'
import { 
  Terminal, 
  Server, 
  AlertTriangle, 
  RefreshCw, 
  Home,
  Cpu,
  Shield
} from 'lucide-react'
import './ErrorBoundary.css' // We'll create this CSS file

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCode: this.generateErrorCode(),
      timestamp: null
    }
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      timestamp: new Date().toISOString()
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })
    this.logErrorToConsole(error, errorInfo)
  }

  generateErrorCode() {
    const codes = [
      '0xDEADBEEF',
      '0xCAFEBABE',
      '0xBADCODE1',
      '0xSYSTEM32',
      '0xKERNELP',
      '0xSEGFAULT',
      '0xNULLPTR',
      '0xSTACKOVF'
    ]
    return codes[Math.floor(Math.random() * codes.length)]
  }

  logErrorToConsole(error, errorInfo) {
    const styles = [
      'color: #ff0000; font-weight: bold; font-size: 14px;',
      'color: #ffffff;',
      'color: #00ff00;'
    ]
    
    console.log(
      `%c🚨 SYSTEM FAILURE DETECTED 🚨\n%cError: ${error.message}\n%cStack: ${errorInfo.componentStack.split('\n')[1]}`,
      ...styles
    )
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCode: this.generateErrorCode(),
      timestamp: null 
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-green-400 font-mono relative error-boundary-container">
          {/* Matrix Background */}
          <div className="fixed inset-0 bg-black opacity-90 z-0 matrix-bg"></div>

          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="max-w-2xl w-full">
              {/* Terminal Header */}
              <div className="bg-black border border-red-500 rounded-lg shadow-2xl shadow-red-500/20 mb-6">
                <div className="flex items-center space-x-2 p-4 border-b border-red-500/30">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="text-red-400 text-sm ml-2">cyber-arena.ctf -- system_monitor</div>
                </div>
                
                <div className="p-6">
                  {/* System Header */}
                  <div className="flex items-center space-x-2 text-red-400 mb-6">
                    <Terminal className="w-5 h-5" />
                    <span className="text-sm">CRITICAL_SYSTEM_FAILURE</span>
                  </div>

                  {/* Error Display */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-white mb-4">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                      <h1 className="text-3xl font-bold glitch-text" data-text="SYSTEM_FAILURE">
                        SYSTEM_FAILURE
                      </h1>
                    </div>

                    {/* Error Details */}
                    <div className="bg-black border border-red-500 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">ERROR_CODE:</span>
                          <div className="text-red-400 font-bold">{this.state.errorCode}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">TIMESTAMP:</span>
                          <div className="text-green-400">
                            {this.state.timestamp ? new Date(this.state.timestamp).toLocaleTimeString() : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500">DESCRIPTION:</span>
                        <div className="text-yellow-400 mt-1 font-mono text-sm">
                          {this.state.error?.message || 'Unknown system malfunction'}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500">COMPONENT:</span>
                        <div className="text-cyan-400 mt-1 font-mono text-sm">
                          {this.state.errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown module'}
                        </div>
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-black border border-yellow-500 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-yellow-400 mb-3">
                        <Server className="w-4 h-4" />
                        <span className="text-sm font-bold">SYSTEM_STATUS</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
                        <div>
                          <div className="text-green-300">FRONTEND</div>
                          <div className="text-red-400 font-bold">FAILED</div>
                        </div>
                        <div>
                          <div className="text-green-300">BACKEND</div>
                          <div className="text-green-400 font-bold">ONLINE</div>
                        </div>
                        <div>
                          <div className="text-green-300">DATABASE</div>
                          <div className="text-green-400 font-bold">ONLINE</div>
                        </div>
                        <div>
                          <div className="text-green-300">NETWORK</div>
                          <div className="text-green-400 font-bold">STABLE</div>
                        </div>
                      </div>
                    </div>

                    {/* Recovery Instructions */}
                    <div className="bg-black border border-cyan-500 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-cyan-400 mb-3">
                        <Cpu className="w-4 h-4" />
                        <span className="text-sm font-bold">RECOVERY_PROTOCOL</span>
                      </div>
                      <div className="text-green-300 text-sm space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-cyan-400">[1]</span>
                          <span>Attempt component reload</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-cyan-400">[2]</span>
                          <span>Return to system main</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-cyan-400">[3]</span>
                          <span>Full system restart</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                      <button
                        onClick={this.handleReset}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-cyan-600 text-white rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all border border-cyan-400 font-bold"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>RELOAD_COMPONENT</span>
                      </button>
                      
                      <button
                        onClick={this.handleGoHome}
                        className="flex items-center justify-center space-x-2 px-4 py-3 border border-green-500 text-green-400 rounded-lg hover:border-cyan-400 hover:text-cyan-400 transition-all font-bold"
                      >
                        <Home className="w-4 h-4" />
                        <span>SYSTEM_MAIN</span>
                      </button>
                      
                      <button
                        onClick={this.handleReload}
                        className="flex items-center justify-center space-x-2 px-4 py-3 border border-yellow-500 text-yellow-400 rounded-lg hover:border-yellow-400 hover:text-yellow-300 transition-all font-bold"
                      >
                        <Shield className="w-4 h-4" />
                        <span>FULL_RESTART</span>
                      </button>
                    </div>

                    {/* Debug Info */}
                    {import.meta.env.DEV && this.state.error && (
                      <div className="mt-6 p-4 bg-black border border-gray-500 rounded-lg">
                        <div className="text-gray-400 text-sm mb-2">DEBUG_INFO:</div>
                        <pre className="text-gray-500 text-xs overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-green-600 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>SYSTEM_MONITOR_ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
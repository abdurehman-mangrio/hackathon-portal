import React, { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'

const SecureTestEnvironment = ({ sessionId, challengeId, onViolation, onTerminate }) => {
  const [webcamActive, setWebcamActive] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [violations, setViolations] = useState(0)
  const [sessionStatus, setSessionStatus] = useState('initializing')
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const detectionInterval = useRef(null)
  const focusMonitor = useRef(null)
  const tabSwitchCount = useRef(0)

  // Initialize secure environment
  useEffect(() => {
    initializeSecureEnvironment()
    return () => cleanup()
  }, [])

  const initializeSecureEnvironment = async () => {
    try {
      // Request fullscreen
      await requestFullscreen()
      
      // Initialize webcam
      await initializeWebcam()
      
      // Start security monitoring
      startSecurityMonitoring()
      
      // Setup event listeners
      setupEventListeners()
      
      setSessionStatus('active')
      toast.success('Secure test environment activated')
      
    } catch (error) {
      console.error('Failed to initialize secure environment:', error)
      toast.error('Failed to initialize secure environment')
      onTerminate?.(`Initialization failed: ${error.message}`)
    }
  }

  const requestFullscreen = async () => {
    try {
      const element = document.documentElement
      
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen()
      }
      
      setFullscreen(true)
      
      // Lock orientation if on mobile
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('portrait')
        } catch (e) {
          console.warn('Orientation lock not supported')
        }
      }
      
    } catch (error) {
      throw new Error('Fullscreen access denied')
    }
  }

  const initializeWebcam = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 15 },
          facingMode: 'user'
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setWebcamActive(true)
      
      // Verify webcam with backend
      await verifyWebcamWithBackend()
      
    } catch (error) {
      throw new Error(`Webcam access denied: ${error.message}`)
    }
  }

  const verifyWebcamWithBackend = async () => {
    try {
      const response = await fetch(`/api/secure-session/${sessionId}/verify-webcam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          streamData: 'verified'
        })
      })

      if (!response.ok) {
        throw new Error('Webcam verification failed')
      }
    } catch (error) {
      throw new Error('Failed to verify webcam with server')
    }
  }

  const startSecurityMonitoring = () => {
    // Start face detection interval
    detectionInterval.current = setInterval(() => {
      performFaceDetection()
    }, 5000) // Check every 5 seconds

    // Start focus monitoring
    focusMonitor.current = setInterval(() => {
      checkFocusStatus()
    }, 1000)
  }

  const performFaceDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      // This would integrate with face-api.js or similar
      // For now, we'll simulate basic checks
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      // Draw current frame to canvas
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Capture frame for evidence
      const screenshot = canvas.toDataURL('image/jpeg', 0.7)

      // Basic face detection simulation
      const detectionResult = await simulateFaceDetection(video)
      
      if (detectionResult.alerts.length > 0) {
        detectionResult.alerts.forEach(alert => {
          reportViolation('webcam_issue', {
            alertType: alert.type,
            confidence: alert.confidence
          }, screenshot)
        })
      }
      
    } catch (error) {
      console.error('Face detection error:', error)
    }
  }

  const simulateFaceDetection = async (videoElement) => {
    // This is a simulation - in real implementation, use face-api.js
    return new Promise((resolve) => {
      // Simulate detection logic
      const alerts = []
      
      // Simulate random face detection issues (for demo)
      if (Math.random() < 0.05) { // 5% chance of fake alert
        alerts.push({
          type: Math.random() > 0.5 ? 'multiple_faces' : 'no_face',
          confidence: 0.8 + Math.random() * 0.2
        })
      }
      
      resolve({
        faces: Math.random() > 0.1 ? 1 : 0, // 90% chance of one face
        alerts,
        confidence: 0.9
      })
    })
  }

  const checkFocusStatus = () => {
    if (!document.hasFocus()) {
      reportViolation('focus_loss', {
        duration: 1000 // 1 second
      })
    }
  }

  const setupEventListeners = () => {
    // Visibility change (tab switch)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Fullscreen change
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // Context menu (right click)
    document.addEventListener('contextmenu', handleContextMenu)
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown)
    
    // Copy/paste events
    document.addEventListener('copy', handleClipboard)
    document.addEventListener('paste', handleClipboard)
    document.addEventListener('cut', handleClipboard)
    
    // Before unload
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      tabSwitchCount.current++
      reportViolation('tab_switch', {
        count: tabSwitchCount.current,
        urls: [] // Can't access actual URLs for security
      })
      
      toast.warning('Please return to the test window immediately!')
    }
  }

  const handleFullscreenChange = () => {
    const isFullscreen = document.fullscreenElement || 
                        document.webkitFullscreenElement ||
                        document.mozFullScreenElement ||
                        document.msFullscreenElement
    
    if (!isFullscreen) {
      reportViolation('focus_loss', { type: 'fullscreen_exit' })
      toast.error('Fullscreen mode is required!')
      
      // Attempt to re-enter fullscreen
      setTimeout(requestFullscreen, 1000)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    reportViolation('dev_tools', { action: 'right_click' })
    return false
  }

  const handleKeyDown = (e) => {
    // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const blockedCombinations = [
      e.key === 'F12',
      (e.ctrlKey && e.shiftKey && e.key === 'I'),
      (e.ctrlKey && e.shiftKey && e.key === 'J'),
      (e.ctrlKey && e.key === 'u'),
      (e.ctrlKey && e.key === 'U'),
      (e.metaKey && e.altKey && e.key === 'I') // Mac
    ]

    if (blockedCombinations.some(Boolean)) {
      e.preventDefault()
      reportViolation('dev_tools', { action: 'keyboard_shortcut', keys: e.key })
    }
  }

  const handleClipboard = (e) => {
    e.preventDefault()
    reportViolation('clipboard', { action: e.type })
    toast.warning('Clipboard operations are disabled during the test')
    return false
  }

  const handleBeforeUnload = (e) => {
    e.preventDefault()
    e.returnValue = 'Are you sure you want to leave? This may terminate your test session.'
    return e.returnValue
  }

  const reportViolation = async (type, data, screenshot = null) => {
    setViolations(prev => prev + 1)
    
    try {
      const response = await fetch(`/api/secure-session/${sessionId}/violation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type,
          data,
          screenshot
        })
      })

      if (!response.ok) {
        throw new Error('Failed to report violation')
      }

      const result = await response.json()
      
      // Notify parent component
      onViolation?.({
        type,
        data,
        action: result.action
      })

      // Show warning toast
      if (result.action === 'warning') {
        toast.warning(`Security violation detected: ${type}`)
      }

    } catch (error) {
      console.error('Error reporting violation:', error)
    }
  }

  const cleanup = () => {
    // Stop all intervals
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current)
    }
    if (focusMonitor.current) {
      clearInterval(focusMonitor.current)
    }

    // Stop webcam stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Remove event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('contextmenu', handleContextMenu)
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('copy', handleClipboard)
    document.removeEventListener('paste', handleClipboard)
    document.removeEventListener('cut', handleClipboard)
    window.removeEventListener('beforeunload', handleBeforeUnload)

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  if (sessionStatus === 'terminated') {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Test Session Terminated</h2>
          <p className="text-red-200 mb-6">
            Your test session has been terminated due to security violations.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white select-none overflow-hidden">
      {/* Security Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-red-500 px-6 py-3 flex justify-between items-center z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${webcamActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              Webcam: {webcamActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${fullscreen ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              Fullscreen: {fullscreen ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium bg-red-600 px-3 py-1 rounded-full">
            Violations: {violations}
          </div>
        </div>
      </div>

      {/* Hidden video and canvas for face detection */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Main test content */}
      <div className="pt-16 h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gray-800 rounded-lg p-8 mb-6">
            <h1 className="text-3xl font-bold mb-4 text-center">Secure Test Environment</h1>
            <p className="text-gray-300 text-center mb-6">
              You are being monitored for security purposes. Please follow all instructions carefully.
            </p>
            
            <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="space-y-2">
                  <p className="text-red-200 font-medium">⚠️ Do not switch tabs or windows</p>
                  <p className="text-red-200 font-medium">⚠️ Keep your face visible to the webcam</p>
                  <p className="text-red-200 font-medium">⚠️ Do not use keyboard shortcuts</p>
                  <p className="text-red-200 font-medium">⚠️ Fullscreen mode is required</p>
                  <p className="text-red-200 font-medium">⚠️ Do not copy/paste any content</p>
                </div>
              </div>
            </div>
          </div>

          {/* Challenge content area */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Challenge: {challengeId}</h2>
            <div className="prose prose-invert max-w-none">
              {/* Your challenge content will be rendered here */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-400">Challenge content will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Webcam preview */}
      {webcamActive && (
        <div className="fixed bottom-6 right-6 bg-black/80 backdrop-blur-sm rounded-lg p-4 border-2 border-blue-500 z-40">
          <div className="text-center mb-2">
            <span className="text-blue-400 text-sm font-medium flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              </svg>
              Webcam Active
            </span>
          </div>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-48 h-36 rounded-lg border border-blue-400"
          />
          <p className="text-blue-300 text-xs mt-2 text-center">You are being monitored</p>
        </div>
      )}

      {/* Violation flash effect */}
      {violations > 0 && (
        <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none z-30"></div>
      )}
    </div>
  )
}

export default SecureTestEnvironment
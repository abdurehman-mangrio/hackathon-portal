import React, { useState } from 'react'

const SecureChallengeStart = ({ challenge, onStart, onCancel }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [webcamTested, setWebcamTested] = useState(false)
  const [isTestingWebcam, setIsTestingWebcam] = useState(false)

  const testWebcam = async () => {
    setIsTestingWebcam(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      })
      // Stop the stream after testing
      stream.getTracks().forEach(track => track.stop())
      setWebcamTested(true)
    } catch (error) {
      alert('Webcam access is required to continue with the test.')
    } finally {
      setIsTestingWebcam(false)
    }
  }

  const handleStart = () => {
    if (!acceptedTerms || !webcamTested) return
    onStart()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Secure Test Environment</h1>
          <p className="text-red-100">Enhanced security monitoring enabled</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Challenge Info */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-2">{challenge.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                {challenge.points} Points
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                {challenge.category}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {challenge.difficulty}
              </span>
            </div>
          </div>

          {/* Security Requirements */}
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Security Requirements
            </h3>
            <ul className="space-y-3 text-yellow-200">
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Webcam access for facial recognition
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Fullscreen mode throughout the test
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No tab switching allowed
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Clipboard and right-click disabled
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Real-time activity monitoring
              </li>
            </ul>
          </div>

          {/* Webcam Test */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Webcam Setup</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 mb-2">
                  Test your webcam to ensure it's working properly
                </p>
                <p className={`text-sm ${webcamTested ? 'text-green-400' : 'text-yellow-400'}`}>
                  {webcamTested ? 'Webcam test successful!' : 'Webcam not tested yet'}
                </p>
              </div>
              <button
                onClick={testWebcam}
                disabled={isTestingWebcam || webcamTested}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  webcamTested 
                    ? 'bg-green-600 text-white cursor-not-allowed' 
                    : isTestingWebcam
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isTestingWebcam ? 'Testing...' : webcamTested ? 'Tested ✓' : 'Test Webcam'}
              </button>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="bg-gray-700 rounded-lg p-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="text-sm text-gray-300">
                <span className="font-medium">I understand and agree to the following:</span>
                <ul className="mt-2 space-y-1 text-gray-400">
                  <li>• I will not switch tabs or windows during the test</li>
                  <li>• I will keep my face visible to the webcam at all times</li>
                  <li>• I will not use any prohibited keyboard shortcuts</li>
                  <li>• I understand that violations may result in test termination</li>
                  <li>• I consent to real-time monitoring and recording</li>
                </ul>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={!acceptedTerms || !webcamTested}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                acceptedTerms && webcamTested
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Start Secure Test
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecureChallengeStart
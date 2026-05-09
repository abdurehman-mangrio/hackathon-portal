import React, { useRef, useState, useEffect } from 'react';

const FaceDetection = ({ onVerification, verificationMode = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, capturing, verifying, success, error
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        } 
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      if (verificationMode) {
        startFaceDetection();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsDetecting(false);
    setFaceDetected(false);
  };

  const startFaceDetection = () => {
    setIsDetecting(true);
    detectFace();
  };

  const detectFace = () => {
    if (!isDetecting || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simple face detection simulation
    // In a real app, you would use a proper face detection library like face-api.js
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const hasFace = simulateFaceDetection(imageData);

    setFaceDetected(hasFace);

    if (verificationMode && hasFace) {
      captureForVerification();
    } else {
      requestAnimationFrame(detectFace);
    }
  };

  const simulateFaceDetection = (imageData) => {
    // This is a simplified simulation
    // Real implementation would use proper face detection
    const data = imageData.data;
    let skinTonePixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Simple skin tone detection (very basic)
      if (r > 95 && g > 40 && b > 20 && 
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 15 && r > g && r > b) {
        skinTonePixels++;
      }
    }

    const skinRatio = skinTonePixels / (data.length / 4);
    return skinRatio > 0.1; // Arbitrary threshold
  };

  const captureForVerification = () => {
    setVerificationStatus('capturing');
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    
    // Simulate verification process
    setVerificationStatus('verifying');
    
    setTimeout(() => {
      const verified = Math.random() > 0.3; // 70% success rate for demo
      setVerificationStatus(verified ? 'success' : 'error');
      
      if (verified) {
        onVerification?.(true, imageData);
      } else {
        onVerification?.(false, imageData);
      }

      // Continue detection after verification attempt
      setTimeout(() => {
        if (isDetecting) {
          setVerificationStatus('idle');
          requestAnimationFrame(detectFace);
        }
      }, 2000);
    }, 1500);
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg');
  };

  const handleManualCapture = () => {
    const image = captureImage();
    setCapturedImage(image);
    onVerification?.(true, image);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {verificationMode ? 'Face Verification' : 'Face Detection'}
        </h3>
        
        <div className="flex space-x-2">
          {!stream ? (
            <button
              onClick={startCamera}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Stop Camera
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Camera Feed */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          {stream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                className="hidden"
              />
              
              {/* Detection Overlay */}
              {isDetecting && (
                <div className="absolute inset-0 border-4 border-green-400 rounded-lg pointer-events-none">
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      faceDetected 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {faceDetected ? 'Face Detected' : 'No Face'}
                    </span>
                  </div>
                </div>
              )}

              {/* Verification Status */}
              {verificationMode && verificationStatus !== 'idle' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    {verificationStatus === 'capturing' && (
                      <>
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p>Capturing image...</p>
                      </>
                    )}
                    {verificationStatus === 'verifying' && (
                      <>
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p>Verifying identity...</p>
                      </>
                    )}
                    {verificationStatus === 'success' && (
                      <>
                        <div className="text-4xl mb-2">✅</div>
                        <p>Verification Successful!</p>
                      </>
                    )}
                    {verificationStatus === 'error' && (
                      <>
                        <div className="text-4xl mb-2">❌</div>
                        <p>Verification Failed</p>
                        <p className="text-sm opacity-75 mt-1">Please try again</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p>Camera not active</p>
                <p className="text-sm mt-1">Click "Start Camera" to begin</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {stream && !verificationMode && (
              <button
                onClick={startFaceDetection}
                disabled={isDetecting}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                {isDetecting ? 'Detecting...' : 'Start Detection'}
              </button>
            )}
            
            {stream && verificationMode && (
              <button
                onClick={handleManualCapture}
                disabled={verificationStatus !== 'idle'}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Manual Capture
              </button>
            )}
          </div>

          {faceDetected && !verificationMode && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Face Detected
            </span>
          )}
        </div>

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Captured Image
            </h4>
            <img
              src={capturedImage}
              alt="Captured"
              className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Instructions
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Ensure good lighting</li>
            <li>• Face the camera directly</li>
            <li>• Remove sunglasses or hats</li>
            {verificationMode && <li>• Stay still during verification</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FaceDetection;
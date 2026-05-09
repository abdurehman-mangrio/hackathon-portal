import * as faceapi from 'face-api.js'

export class FaceDetectionService {
  constructor() {
    this.modelsLoaded = false
    this.detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 512,
      scoreThreshold: 0.5
    })
  }

  async loadModels() {
    if (this.modelsLoaded) return

    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models')
      await faceapi.nets.faceExpressionNet.loadFromUri('/models')
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      
      this.modelsLoaded = true
      console.log('Face detection models loaded successfully')
    } catch (error) {
      console.error('Error loading face detection models:', error)
      throw error
    }
  }

  async detectFaces(videoElement) {
    if (!this.modelsLoaded) {
      await this.loadModels()
    }

    try {
      const detections = await faceapi
        .detectAllFaces(videoElement, this.detectionOptions)
        .withFaceLandmarks(true)
        .withFaceExpressions()

      return this.analyzeDetections(detections)
    } catch (error) {
      console.error('Error detecting faces:', error)
      return { faces: [], alerts: [] }
    }
  }

  analyzeDetections(detections) {
    const result = {
      faces: detections.length,
      alerts: [],
      confidence: 0,
      expressions: {}
    }

    if (detections.length === 0) {
      result.alerts.push({
        type: 'no_face',
        confidence: 1.0,
        message: 'No face detected in frame'
      })
    } else if (detections.length > 1) {
      result.alerts.push({
        type: 'multiple_faces',
        confidence: 1.0,
        message: `Multiple faces detected: ${detections.length}`
      })
    }

    // Analyze each face
    detections.forEach((detection, index) => {
      const { detection: face, expressions } = detection
      
      result.confidence = Math.max(result.confidence, face.score)
      
      // Check if face is properly centered and visible
      if (face.box.width < 100 || face.box.height < 100) {
        result.alerts.push({
          type: 'face_too_small',
          confidence: 0.8,
          message: 'Face appears too small in frame'
        })
      }

      // Analyze facial expressions for suspicious activity
      const suspiciousExpressions = this.analyzeExpressions(expressions)
      if (suspiciousExpressions.length > 0) {
        result.alerts.push(...suspiciousExpressions)
      }

      // Store expression data
      result.expressions[`face_${index}`] = expressions
    })

    return result
  }

  analyzeExpressions(expressions) {
    const alerts = []
    const threshold = 0.7

    if (expressions.surprised > threshold) {
      alerts.push({
        type: 'suspicious_expression',
        confidence: expressions.surprised,
        message: 'Suspicious expression detected: surprise'
      })
    }

    if (expressions.fearful > threshold) {
      alerts.push({
        type: 'suspicious_expression',
        confidence: expressions.fearful,
        message: 'Suspicious expression detected: fear'
      })
    }

    if (expressions.angry > threshold) {
      alerts.push({
        type: 'suspicious_expression',
        confidence: expressions.angry,
        message: 'Suspicious expression detected: anger'
      })
    }

    return alerts
  }

  async captureFrame(videoElement, quality = 0.7) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      
      const imageData = canvas.toDataURL('image/jpeg', quality)
      resolve(imageData)
    })
  }

  validateWebcamStream(stream) {
    const track = stream.getVideoTracks()[0]
    if (!track) {
      throw new Error('No video track found in webcam stream')
    }

    const settings = track.getSettings()
    
    // Validate minimum requirements
    if (settings.width < 640 || settings.height < 480) {
      throw new Error('Webcam resolution too low. Minimum 640x480 required.')
    }

    if (settings.frameRate < 15) {
      throw new Error('Webcam frame rate too low. Minimum 15 FPS required.')
    }

    return true
  }
}

export default new FaceDetectionService()
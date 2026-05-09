import React, { useState, useEffect } from 'react'
import fileService from '../../services/fileService'

const FileList = ({ challengeId, showActions = true, publicOnly = true }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true)
        const response = await fileService.getChallengeFiles(challengeId, publicOnly)
        setFiles(response.files || [])
      } catch (err) {
        console.error('Error fetching files:', err)
        setError(err.response?.data?.error || 'Failed to load files')
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchFiles()
    } else {
      setFiles([])
      setLoading(false)
    }
  }, [challengeId, publicOnly])

  const handleDownload = async (file) => {
    try {
      await fileService.downloadFile(file.challenge, file.filename, file.originalName)
    } catch (err) {
      console.error('Error downloading file:', err)
      setError(err.response?.data?.error || 'Failed to download file')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimetype) => {
    if (mimetype?.includes('image')) return '🖼️'
    if (mimetype?.includes('pdf')) return '📄'
    if (mimetype?.includes('zip') || mimetype?.includes('compressed')) return '📦'
    if (mimetype?.includes('text') || mimetype?.includes('document')) return '📝'
    return '📁'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-400 mr-2">❌</span>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📁</div>
        <p>No files available for this challenge.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file._id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {getFileIcon(file.mimetype)}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {file.originalName}
              </div>
              <div className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.downloadCount || 0} downloads
              </div>
            </div>
          </div>

          {showActions && (
            <button
              onClick={() => handleDownload(file)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
            >
              Download
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default FileList
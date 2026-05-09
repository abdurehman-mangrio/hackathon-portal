import React, { useState, useRef } from 'react'

const FileUpload = ({ 
  onUpload, 
  accept = '*', 
  maxSize = 50 * 1024 * 1024, // 50MB
  multiple = false,
  label = 'Upload Files',
  description = 'Drag and drop files here or click to browse'
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
  }

  const handleFiles = async (files) => {
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      await onUpload(validFiles)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-900">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
              <p className="text-xs text-gray-400 mt-2">
                Max file size: {maxSize / 1024 / 1024}MB
                {multiple ? ' • Multiple files allowed' : ' • Single file only'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUpload
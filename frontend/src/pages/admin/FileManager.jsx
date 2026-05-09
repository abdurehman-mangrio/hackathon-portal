import React, { useState, useEffect, useCallback } from 'react'
import fileService from '../../services/fileService'
import { challengeService } from '../../services/challengeService'

const FileManager = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    challengeId: '',
    page: 1,
    limit: 50
  })

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 50,
    totalItems: 0,
    totalPages: 0
  })

  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    averageSize: 0,
    typeBreakdown: {
      images: { count: 0, size: 0 },
      documents: { count: 0, size: 0 },
      archives: { count: 0, size: 0 },
      code: { count: 0, size: 0 }
    }
  })

  const [uploadForm, setUploadForm] = useState({
    challengeId: '',
    challengeTitle: '',
    files: []
  })

  const [challenges, setChallenges] = useState([])

  // Fetch files from API
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        challengeId: filters.challengeId || undefined,
        search: filters.search || undefined
      }

      const response = await fileService.getAdminFiles(params)
      
      setFiles(response.files || [])
      setPagination(prev => ({
        ...prev,
        totalItems: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 0,
        currentPage: response.pagination?.page || 1
      }))
    } catch (err) {
      console.error('Error fetching files:', err)
      setError(err.response?.data?.error || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch file statistics
  const fetchStats = async () => {
    try {
      const response = await fileService.getFileStats()
      setStats(response.stats)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  // Fetch challenges for selector
  const fetchChallenges = async () => {
    try {
      const response = await challengeService.getAllChallenges()
      setChallenges(response)
    } catch (err) {
      console.error('Error fetching challenges:', err)
    }
  }

  useEffect(() => {
    fetchFiles()
    fetchStats()
    fetchChallenges()
  }, [fetchFiles])

  // File actions
  const handleUploadFile = () => {
    setUploadForm({
      challengeId: '',
      challengeTitle: '',
      files: []
    })
    setShowUploadModal(true)
  }

  const handlePreviewFile = (file) => {
    setSelectedFile(file)
    setShowPreviewModal(true)
  }

  const handleDownloadFile = async (file) => {
    try {
      setActionLoading(true)
      await fileService.downloadFile(file.challenge?._id || file.challenge, file.filename, file.originalName)
      // Refresh to update download count
      setTimeout(() => {
        fetchFiles()
        fetchStats()
      }, 1000)
    } catch (err) {
      console.error('Error downloading file:', err)
      setError(err.response?.data?.error || 'Failed to download file')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteFile = (file) => {
    setSelectedFile(file)
    setShowDeleteModal(true)
  }

  const confirmDeleteFile = async () => {
    if (!selectedFile) return

    try {
      setActionLoading(true)
      await fileService.deleteFile(selectedFile._id)
      await fetchFiles()
      await fetchStats()
      setShowDeleteModal(false)
      setSelectedFile(null)
    } catch (err) {
      console.error('Error deleting file:', err)
      setError(err.response?.data?.error || 'Failed to delete file')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!uploadForm.challengeId || uploadForm.files.length === 0) {
      setError('Please select a challenge and at least one file.')
      return
    }

    try {
      setActionLoading(true)

      const formData = new FormData()
      uploadForm.files.forEach(file => {
        formData.append('files', file)
      })

      await fileService.uploadChallengeFiles(uploadForm.challengeId, formData)
      
      await fetchFiles()
      await fetchStats()
      setShowUploadModal(false)
      setUploadForm({
        challengeId: '',
        files: []
      })
    } catch (err) {
      console.error('Error uploading files:', err)
      setError(err.response?.data?.error || 'Failed to upload files')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setUploadForm(prev => ({
      ...prev,
      files: selectedFiles
    }))
  }

  const handleCleanupOrphaned = async () => {
    try {
      setActionLoading(true)
      const response = await fileService.cleanupOrphanedFiles()
      alert(`Cleanup completed: ${response.cleanedCount} orphaned files removed`)
      await fetchFiles()
      await fetchStats()
    } catch (err) {
      console.error('Error cleaning up files:', err)
      setError(err.response?.data?.error || 'Cleanup failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  // Utility functions
  const getFileIcon = (mimetype) => {
    if (mimetype?.includes('image')) return '🖼️'
    if (mimetype?.includes('pdf')) return '📄'
    if (mimetype?.includes('zip') || mimetype?.includes('compressed')) return '📦'
    if (mimetype?.includes('text') || mimetype?.includes('document')) return '📝'
    if (mimetype?.includes('video')) return '🎬'
    if (mimetype?.includes('audio')) return '🎵'
    return '📁'
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && files.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading files...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
            <p className="text-gray-600 mt-2">Manage uploaded files and challenge resources</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleUploadFile}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <span>📤 Upload Files</span>
            </button>
            <button
              onClick={handleCleanupOrphaned}
              disabled={actionLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <span>🧹 Cleanup Orphaned</span>
            </button>
            <button
              onClick={fetchFiles}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <span>🔄 Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">❌</span>
                {error}
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard value={stats.totalFiles} label="Total Files" color="blue" />
          <StatCard value={formatFileSize(stats.totalSize)} label="Total Size" color="green" />
          <StatCard value={stats.totalDownloads} label="Total Downloads" color="purple" />
          <StatCard value={stats.typeBreakdown.images.count} label="Images" color="orange" />
          <StatCard value={stats.typeBreakdown.documents.count} label="Documents" color="yellow" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Files
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by filename..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge ID
              </label>
              <input
                type="text"
                value={filters.challengeId}
                onChange={(e) => handleFilterChange('challengeId', e.target.value)}
                placeholder="Filter by challenge ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items per page
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Files Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Challenge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Downloads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <FileRow 
                    key={file._id} 
                    file={file}
                    onPreview={handlePreviewFile}
                    onDownload={handleDownloadFile}
                    onDelete={handleDeleteFile}
                    getFileIcon={getFileIcon}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {files.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.challengeId
                  ? 'No files match your current filters.'
                  : 'Get started by uploading your first file.'
                }
              </p>
              {(filters.search || filters.challengeId) ? (
                <button
                  onClick={() => setFilters({ search: '', challengeId: '', page: 1, limit: 50 })}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={handleUploadFile}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Upload File
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-8">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} files
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || loading}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {showUploadModal && (
          <UploadModal
            form={uploadForm}
            loading={actionLoading}
            onClose={() => setShowUploadModal(false)}
            onSubmit={handleUploadSubmit}
            onFileSelect={handleFileSelect}
            onFormChange={(updates) => setUploadForm(prev => ({ ...prev, ...updates }))}
            challenges={challenges}
          />
        )}

        {showPreviewModal && (
          <PreviewModal
            file={selectedFile}
            onClose={() => {
              setShowPreviewModal(false)
              setSelectedFile(null)
            }}
            onDownload={handleDownloadFile}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
          />
        )}

        {showDeleteModal && (
          <DeleteModal
            file={selectedFile}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedFile(null)
            }}
            onConfirm={confirmDeleteFile}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  )
}

// Sub-components
const StatCard = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600'
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

const FileRow = ({ file, onPreview, onDownload, onDelete, getFileIcon, formatFileSize, formatDate }) => (
  <tr key={file._id} className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="text-2xl mr-3">{getFileIcon(file.mimetype)}</div>
        <div>
          <div className="text-sm font-medium text-gray-900">{file.originalName}</div>
          <div className="text-sm text-gray-500">{file.mimetype}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-900">
        {file.challenge?.title || 'Unknown Challenge'}
      </div>
      <div className="text-sm text-gray-500">
        {file.challenge?.category || 'N/A'}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {formatFileSize(file.size)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {file.downloadCount || 0}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {formatDate(file.createdAt)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        file.isPublic 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {file.isPublic ? 'Public' : 'Private'}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      <div className="flex space-x-2">
        <button
          onClick={() => onPreview(file)}
          className="text-blue-600 hover:text-blue-900"
        >
          View
        </button>
        <button
          onClick={() => onDownload(file)}
          className="text-green-600 hover:text-green-900"
        >
          Download
        </button>
        <button
          onClick={() => onDelete(file)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </div>
    </td>
  </tr>
)

const UploadModal = ({ form, loading, onClose, onSubmit, onFileSelect, onFormChange, challenges }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(e)
  }

  const handleChallengeSelect = (e) => {
    const selectedChallengeId = e.target.value
    const selectedChallenge = challenges.find(c => c._id === selectedChallengeId)
    onFormChange({
      challengeId: selectedChallengeId,
      challengeTitle: selectedChallenge ? selectedChallenge.title : ''
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Files</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Challenge *
              </label>
              <select
                value={form.challengeId}
                onChange={handleChallengeSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a challenge...</option>
                {challenges.map((challenge) => (
                  <option key={challenge._id} value={challenge._id}>
                    {challenge.title} ({challenge.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Files *
              </label>
              <input
                type="file"
                onChange={onFileSelect}
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {form.files.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected {form.files.length} file(s)
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
                disabled={loading || !form.challengeId || form.files.length === 0}
              >
                {loading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const PreviewModal = ({ file, onClose, onDownload, getFileIcon, formatFileSize, formatDate }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">File Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
        <div className="flex items-center space-x-4 mb-6">
          <div className="text-4xl">{getFileIcon(file?.mimetype)}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{file?.originalName}</h3>
            <p className="text-gray-600 text-sm">{file?.filename}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div><span className="font-medium text-gray-700">Type:</span> {file?.mimetype}</div>
          <div><span className="font-medium text-gray-700">Size:</span> {formatFileSize(file?.size)}</div>
          <div><span className="font-medium text-gray-700">Uploaded:</span> {formatDate(file?.createdAt)}</div>
          <div><span className="font-medium text-gray-700">Downloads:</span> {file?.downloadCount}</div>
          <div><span className="font-medium text-gray-700">Challenge:</span> {file?.challenge?.title || 'N/A'}</div>
          <div>
            <span className="font-medium text-gray-700">Visibility:</span>
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              file?.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {file?.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg">
            Close
          </button>
          <button onClick={() => onDownload(file)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
            Download File
          </button>
        </div>
      </div>
    </div>
  </div>
)

const DeleteModal = ({ file, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Delete File</h2>
        
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to delete <strong>"{file?.originalName}"</strong>? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete File'}
          </button>
        </div>
      </div>
    </div>
  </div>
)

export default FileManager
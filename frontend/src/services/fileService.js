import api from './api.js'

const fileService = {
  // Upload files for a challenge (admin only)
  uploadChallengeFiles: async (challengeId, formData) => {
    const response = await api.post(`/files/challenge/${challengeId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Download file
  downloadFile: async (challengeId, filename, originalName) => {
    const response = await api.get(`/files/download/${challengeId}/${filename}`, {
      responseType: 'blob',
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', originalName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response
  },

  // Get files for a challenge
  getChallengeFiles: async (challengeId, publicOnly = true) => {
    const response = await api.get(`/files/challenge/${challengeId}`, {
      params: { publicOnly }
    })
    return response.data
  },

  // Admin: Get all files with pagination
  getAdminFiles: async (params = {}) => {
    const response = await api.get('/files/admin', { params })
    return response.data
  },

  // Admin: Update file visibility
  updateFileVisibility: async (fileId, isPublic) => {
    const response = await api.patch(`/files/admin/${fileId}`, { isPublic })
    return response.data
  },

  // Admin: Delete file
  deleteFile: async (fileId) => {
    const response = await api.delete(`/files/admin/${fileId}`)
    return response.data
  },

  // Admin: Get file statistics
  getFileStats: async () => {
    const response = await api.get('/files/stats')
    return response.data
  },

  // Admin: Clean up orphaned files
  cleanupOrphanedFiles: async () => {
    const response = await api.post('/files/admin/cleanup')
    return response.data
  }
}

export default fileService
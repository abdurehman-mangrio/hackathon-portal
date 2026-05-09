import React, { useState, useEffect, useCallback } from 'react';
import { writeupService } from '../../services/writeupService';

const WriteupManagement = () => {
  const [writeups, setWriteups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWriteup, setSelectedWriteup] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    isPublic: 'all', // all, public, private
    sortBy: 'rating' // rating, recent, views
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Fetch writeups from real API
  const fetchWriteups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        sort: filters.sortBy
      };

      if (filters.search) {
        params.q = filters.search;
      }

      // For admin, we want to see all writeups regardless of public status
      // We'll use search endpoint and handle filtering client-side for now
      const response = await writeupService.searchWriteups(params);
      
      // Filter by public/private status client-side since backend doesn't support it in search
      let filteredWriteups = response.writeups || [];
      if (filters.isPublic !== 'all') {
        const isPublic = filters.isPublic === 'public';
        filteredWriteups = filteredWriteups.filter(writeup => writeup.isPublic === isPublic);
      }

      setWriteups(filteredWriteups);
      setPagination(prev => ({
        ...prev,
        totalItems: response.pagination?.total || filteredWriteups.length
      }));
    } catch (err) {
      console.error('Error fetching writeups:', err);
      setError(err.response?.data?.error || 'Failed to load writeups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    fetchWriteups();
  }, [fetchWriteups]);

  // Writeup actions
  const handlePreviewWriteup = async (writeup) => {
    try {
      setActionLoading(true);
      const response = await writeupService.getWriteup(writeup._id);
      setSelectedWriteup(response.writeup);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error fetching writeup details:', err);
      setError(err.response?.data?.error || 'Failed to load writeup details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVisibility = async (writeup) => {
    try {
      setActionLoading(true);
      await writeupService.updateWriteup(writeup._id, {
        isPublic: !writeup.isPublic
      });
      await fetchWriteups();
    } catch (err) {
      console.error('Error updating writeup:', err);
      setError(err.response?.data?.error || 'Failed to update writeup. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteWriteup = (writeup) => {
    setSelectedWriteup(writeup);
    setShowDeleteModal(true);
  };

  const confirmDeleteWriteup = async () => {
    if (!selectedWriteup) return;

    try {
      setActionLoading(true);
      await writeupService.deleteWriteup(selectedWriteup._id);
      await fetchWriteups();
      setShowDeleteModal(false);
      setSelectedWriteup(null);
    } catch (err) {
      console.error('Error deleting writeup:', err);
      setError(err.response?.data?.error || 'Failed to delete writeup. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  // Stats
  const getWriteupStats = () => {
    const total = writeups.length;
    const publicWriteups = writeups.filter(w => w.isPublic).length;
    const privateWriteups = writeups.filter(w => !w.isPublic).length;

    return { total, public: publicWriteups, private: privateWriteups };
  };

  const stats = getWriteupStats();

  if (loading && writeups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading writeups...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Writeup Management</h1>
            <p className="text-gray-600 mt-2">
              Manage and review user writeups
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchWriteups}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard value={stats.total} label="Total Writeups" color="blue" />
          <StatCard value={stats.public} label="Public" color="green" />
          <StatCard value={stats.private} label="Private" color="yellow" />
          <StatCard value={pagination.totalItems} label="Total in DB" color="purple" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search writeups..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                value={filters.isPublic}
                onChange={(e) => setFilters(prev => ({ ...prev, isPublic: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Writeups</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rating">Highest Rated</option>
                <option value="recent">Most Recent</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Writeups Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Writeup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Challenge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {writeups.map((writeup) => (
                  <WriteupTableRow
                    key={writeup._id}
                    writeup={writeup}
                    onPreview={handlePreviewWriteup}
                    onToggleVisibility={handleToggleVisibility}
                    onDelete={handleDeleteWriteup}
                    actionLoading={actionLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {writeups.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No writeups found
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.isPublic !== 'all'
                  ? 'No writeups match your current filters.'
                  : 'No writeups available.'
                }
              </p>
              {(filters.search || filters.isPublic !== 'all') && (
                <button
                  onClick={() => setFilters({ search: '', isPublic: 'all', sortBy: 'rating' })}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Loading State for Table */}
          {loading && writeups.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} writeups
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === totalPages || loading}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && (
          <PreviewModal
            writeup={selectedWriteup}
            onClose={() => {
              setShowPreviewModal(false);
              setSelectedWriteup(null);
            }}
            loading={actionLoading}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteModal
            item={selectedWriteup}
            itemName="writeup"
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedWriteup(null);
            }}
            onConfirm={confirmDeleteWriteup}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

// Writeup Table Row Component
const WriteupTableRow = ({ writeup, onPreview, onToggleVisibility, onDelete, actionLoading }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
            📝
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {writeup.title}
            </div>
            <div className="text-sm text-gray-500 line-clamp-2">
              {writeup.content?.substring(0, 100)}...
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {writeup.challenge?.title || 'Unknown Challenge'}
        </div>
        <div className="text-sm text-gray-500">
          {writeup.challenge?.category || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {writeup.user?.username || 'Unknown'}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          <div>Rating: {writeup.rating || 0}</div>
          <div>Views: {writeup.views || 0}</div>
          <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            writeup.isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {writeup.isPublic ? 'Public' : 'Private'}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {writeup.createdAt ? new Date(writeup.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onPreview(writeup)}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="Preview Writeup"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          <button
            onClick={() => onToggleVisibility(writeup)}
            disabled={actionLoading}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
            title={writeup.isPublic ? 'Make Private' : 'Make Public'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {writeup.isPublic ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(writeup)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete Writeup"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

// Preview Modal Component
const PreviewModal = ({ writeup, onClose, loading }) => {
  if (!writeup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{writeup.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <strong>Challenge:</strong> {writeup.challenge?.title}
            </div>
            <div>
              <strong>Author:</strong> {writeup.user?.username}
            </div>
            <div>
              <strong>Created:</strong> {writeup.createdAt ? new Date(writeup.createdAt).toLocaleString() : 'N/A'}
            </div>
            <div>
              <strong>Visibility:</strong> 
              <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${
                writeup.isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {writeup.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <div>
              <strong>Rating:</strong> {writeup.rating || 0}
            </div>
            <div>
              <strong>Views:</strong> {writeup.views || 0}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-4">Writeup Content</h3>
            <div className="bg-gray-50 p-4 rounded-lg mt-2">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {writeup.content}
              </pre>
            </div>
            
            {writeup.tags && writeup.tags.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {writeup.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ item, itemName, onClose, onConfirm, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Delete {itemName.charAt(0).toUpperCase() + itemName.slice(1)}
          </h2>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete the writeup <strong>"{item?.title}"</strong>? This action cannot be undone.
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
              {loading ? 'Deleting...' : `Delete ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteupManagement;
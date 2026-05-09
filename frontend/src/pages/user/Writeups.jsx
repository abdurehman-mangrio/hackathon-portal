// src/pages/user/Writeups.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { writeupService } from '../../services/writeupService';
import { challengeService } from '../../services/challengeService';
import { useAuth } from '../../contexts/AuthContext';

const UserWriteups = () => {
  const { user } = useAuth();
  const [writeups, setWriteups] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedWriteup, setSelectedWriteup] = useState(null);

  const [writeupForm, setWriteupForm] = useState({
    challengeId: '',
    title: '',
    content: '',
    isPublic: true
  });

  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [writeupsData, challengesData] = await Promise.all([
        writeupService.getUserWriteups(user?._id),
        challengeService.getSolvedChallenges()
      ]);

      setWriteups(writeupsData);
      setChallenges(challengesData);
    } catch (err) {
      console.error('Error fetching writeups data:', err);
      setError(err.message || 'Failed to load writeups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Writeup actions
  const handleCreateWriteup = () => {
    setWriteupForm({
      challengeId: '',
      title: '',
      content: '',
      isPublic: true
    });
    setShowCreateModal(true);
  };

  const handleEditWriteup = (writeup) => {
    setSelectedWriteup(writeup);
    setWriteupForm({
      challengeId: writeup.challenge?._id || '',
      title: writeup.title,
      content: writeup.content,
      isPublic: writeup.isPublic
    });
    setShowEditModal(true);
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
      await fetchData();
      setShowDeleteModal(false);
      setSelectedWriteup(null);
    } catch (err) {
      console.error('Error deleting writeup:', err);
      setError(err.message || 'Failed to delete writeup. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWriteup = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      if (showEditModal && selectedWriteup) {
        await writeupService.updateWriteup(selectedWriteup._id, writeupForm);
      } else {
        await writeupService.createWriteup(writeupForm);
      }

      await fetchData();
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedWriteup(null);
    } catch (err) {
      console.error('Error saving writeup:', err);
      setError(err.message || 'Failed to save writeup. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter writeups
  const filteredWriteups = writeups.filter(writeup => {
    if (filters.status === 'all') return true;
    return writeup.status === filters.status;
  });

  // Stats
  const getWriteupStats = () => {
    const total = writeups.length;
    const approved = writeups.filter(w => w.status === 'approved').length;
    const pending = writeups.filter(w => w.status === 'pending').length;
    const rejected = writeups.filter(w => w.status === 'rejected').length;

    return { total, approved, pending, rejected };
  };

  const stats = getWriteupStats();

  if (loading) {
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
            <h1 className="text-3xl font-bold text-gray-900">My Writeups</h1>
            <p className="text-gray-600 mt-2">
              Share your solutions and methodologies with the community
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateWriteup}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Writeup</span>
            </button>
            <button
              onClick={fetchData}
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
          <StatCard value={stats.approved} label="Approved" color="green" />
          <StatCard value={stats.pending} label="Pending" color="yellow" />
          <StatCard value={stats.rejected} label="Rejected" color="red" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
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
                <option value="createdAt">Creation Date</option>
                <option value="title">Title</option>
                <option value="challenge">Challenge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Writeups List */}
        <div className="space-y-4">
          {filteredWriteups.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Writeups Yet</h3>
              <p className="text-gray-500 mb-4">
                {filters.status !== 'all' 
                  ? `No writeups with status "${filters.status}" found.`
                  : 'Share your first solution with the community!'
                }
              </p>
              {filters.status !== 'all' ? (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Show All Writeups
                </button>
              ) : (
                <button
                  onClick={handleCreateWriteup}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Create Your First Writeup
                </button>
              )}
            </div>
          ) : (
            filteredWriteups.map((writeup) => (
              <WriteupCard
                key={writeup._id}
                writeup={writeup}
                onEdit={handleEditWriteup}
                onDelete={handleDeleteWriteup}
              />
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <WriteupModal
            writeup={selectedWriteup}
            challenges={challenges}
            form={writeupForm}
            loading={actionLoading}
            isEditing={showEditModal}
            onClose={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedWriteup(null);
            }}
            onSubmit={handleSubmitWriteup}
            onFormChange={(updates) => setWriteupForm(prev => ({ ...prev, ...updates }))}
          />
        )}

        {/* Delete Modal */}
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

// Writeup Card Component
const WriteupCard = ({ writeup, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📝';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{writeup.title}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(writeup.status)}`}>
              {getStatusIcon(writeup.status)} {writeup.status}
            </span>
            {writeup.isPublic && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🌐 Public
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Challenge: <strong>{writeup.challenge?.title}</strong></span>
            <span>Category: <strong>{writeup.challenge?.category}</strong></span>
            <span>Created: {new Date(writeup.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onEdit(writeup)}
            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
            title="Edit Writeup"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
      </div>

      <p className="text-gray-600 line-clamp-3 mb-4">
        {writeup.content}
      </p>

      {writeup.feedback && writeup.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-red-600 font-medium">Admin Feedback:</span>
            <span className="text-red-700">{writeup.feedback}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Writeup Modal Component
const WriteupModal = ({ writeup, challenges, form, loading, isEditing, onClose, onSubmit, onFormChange }) => {
  const handleChange = (field, value) => {
    onFormChange({ [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Writeup' : 'Create New Writeup'}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-6">
            {/* Challenge Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge *
              </label>
              <select
                value={form.challengeId}
                onChange={(e) => handleChange('challengeId', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a challenge</option>
                {challenges.map((challenge) => (
                  <option key={challenge._id} value={challenge._id}>
                    {challenge.title} ({challenge.category} - {challenge.points}pts)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only challenges you've solved are available
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a descriptive title for your writeup"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={form.content}
                onChange={(e) => handleChange('content', e.target.value)}
                required
                rows="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Describe your solution methodology, tools used, and step-by-step process..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use markdown formatting for better readability
              </p>
            </div>

            {/* Privacy */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => handleChange('isPublic', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make this writeup public (visible to other users)
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
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
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Writeup' : 'Create Writeup')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Modal Component (Reusable)
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

export default UserWriteups;
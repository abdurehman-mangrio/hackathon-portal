// src/pages/user/Challenges.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { challengeService } from '../../services/challengeService';
import { useAuth } from '../../contexts/AuthContext';

const UserChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    difficulty: 'all',
    status: 'all',
    sortBy: 'points',
    sortOrder: 'asc'
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0
  });

  const [submissionForm, setSubmissionForm] = useState({
    flag: '',
    notes: ''
  });

  // Fetch challenges from real API
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      // Add filters if not 'all'
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.category !== 'all') {
        params.category = filters.category;
      }
      if (filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty;
      }
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      const response = await challengeService.getChallenges(params);
      
      setChallenges(response.challenges || response.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: response.totalCount || response.total || 0
      }));
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError(err.message || 'Failed to load challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Challenge actions
  const handleViewChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setSubmissionForm({ flag: '', notes: '' });
    setShowChallengeModal(true);
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!selectedChallenge || !submissionForm.flag.trim()) return;

    try {
      setSubmissionLoading(true);
      const result = await challengeService.submitFlag(selectedChallenge._id, {
        flag: submissionForm.flag,
        notes: submissionForm.notes
      });

      if (result.success) {
        await fetchChallenges(); // Refresh challenges to update status
        setShowChallengeModal(false);
        setSelectedChallenge(null);
        // Show success message (you can add a toast notification here)
        alert('Congratulations! Challenge solved successfully!');
      } else {
        setError(result.message || 'Incorrect flag. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting flag:', err);
      setError(err.message || 'Failed to submit flag. Please try again.');
    } finally {
      setSubmissionLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  // Stats
  const getChallengeStats = () => {
    const total = pagination.totalItems;
    const solved = challenges.filter(c => c.status === 'solved').length;
    const attempted = challenges.filter(c => c.status === 'attempted').length;
    const totalPoints = challenges.reduce((sum, c) => sum + (c.points || 0), 0);
    const earnedPoints = challenges
      .filter(c => c.status === 'solved')
      .reduce((sum, c) => sum + (c.points || 0), 0);

    return { total, solved, attempted, totalPoints, earnedPoints };
  };

  const stats = getChallengeStats();

  if (loading && challenges.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading challenges...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">CTF Challenges</h1>
            <p className="text-gray-600 mt-2">
              Test your skills and earn points by solving security challenges
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchChallenges}
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard value={stats.total} label="Total Challenges" color="blue" />
          <StatCard value={stats.solved} label="Solved" color="green" />
          <StatCard value={stats.attempted} label="Attempted" color="yellow" />
          <StatCard value={stats.earnedPoints} label="Points Earned" color="purple" />
          <StatCard value={`${stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%`} label="Completion" color="orange" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search challenges..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="web">Web Security</option>
                <option value="crypto">Cryptography</option>
                <option value="forensics">Digital Forensics</option>
                <option value="pwn">Binary Exploitation</option>
                <option value="reversing">Reverse Engineering</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
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
                <option value="solved">Solved</option>
                <option value="attempted">Attempted</option>
                <option value="unsolved">Unsolved</option>
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
                <option value="points">Points</option>
                <option value="title">Title</option>
                <option value="difficulty">Difficulty</option>
                <option value="solvedCount">Popularity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge._id}
              challenge={challenge}
              onView={handleViewChallenge}
            />
          ))}
        </div>

        {/* Empty State */}
        {challenges.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No challenges found
            </h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.category !== 'all' || filters.difficulty !== 'all' || filters.status !== 'all'
                ? 'No challenges match your current filters.'
                : 'No challenges are available at the moment.'
              }
            </p>
            {(filters.search || filters.category !== 'all' || filters.difficulty !== 'all' || filters.status !== 'all') && (
              <button
                onClick={() => setFilters({ 
                  search: '', 
                  category: 'all', 
                  difficulty: 'all', 
                  status: 'all',
                  sortBy: 'points',
                  sortOrder: 'asc'
                })}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-8">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} challenges
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

        {/* Challenge Modal */}
        {showChallengeModal && (
          <ChallengeModal
            challenge={selectedChallenge}
            form={submissionForm}
            loading={submissionLoading}
            onClose={() => {
              setShowChallengeModal(false);
              setSelectedChallenge(null);
            }}
            onSubmit={handleSubmitFlag}
            onFormChange={(updates) => setSubmissionForm(prev => ({ ...prev, ...updates }))}
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

// Challenge Card Component
const ChallengeCard = ({ challenge, onView }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'web': return '🌐';
      case 'crypto': return '🔐';
      case 'forensics': return '🔍';
      case 'pwn': return '💥';
      case 'reversing': return '⚡';
      case 'misc': return '🎯';
      default: return '📁';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'solved': return 'bg-green-100 text-green-800 border-green-200';
      case 'attempted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getCategoryIcon(challenge.category)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty}
              </span>
              <span className="text-sm text-gray-600">{challenge.points} pts</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(challenge.status)}`}>
          {challenge.status === 'solved' ? 'Solved' : challenge.status === 'attempted' ? 'Attempted' : 'New'}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {challenge.description}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>{challenge.category}</span>
        <span>{challenge.solvedCount || 0} solves</span>
      </div>

      <button
        onClick={() => onView(challenge)}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
          challenge.status === 'solved'
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : challenge.status === 'attempted'
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {challenge.status === 'solved' ? 'View Solution' : 'Solve Challenge'}
      </button>
    </div>
  );
};

// Challenge Modal Component
const ChallengeModal = ({ challenge, form, loading, onClose, onSubmit, onFormChange }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      case 'expert': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{challenge?.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getDifficultyColor(challenge?.difficulty)}`}>
              {challenge?.difficulty}
            </span>
            <span className="text-sm text-gray-600">{challenge?.points} points</span>
            <span className="text-sm text-gray-600">{challenge?.category}</span>
            <span className="text-sm text-gray-600">{challenge?.solvedCount || 0} solves</span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          <div className="prose max-w-none mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{challenge?.description}</p>
            </div>
          </div>

          {challenge?.hints && challenge.hints.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Hints</h3>
              <div className="space-y-2">
                {challenge.hints.map((hint, index) => (
                  <div key={hint._id || index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600 font-medium">Hint {index + 1}:</span>
                      <span className="text-yellow-700">{hint.content}</span>
                    </div>
                    {hint.cost && (
                      <div className="text-xs text-yellow-600 mt-1">
                        Cost: {hint.cost} points
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {challenge?.files && challenge.files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Files</h3>
              <div className="space-y-2">
                {challenge.files.map((file, index) => (
                  <div key={file._id || index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">📎</span>
                      <span className="text-blue-700">{file.name}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {challenge?.status !== 'solved' && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flag Submission
                </label>
                <input
                  type="text"
                  value={form.flag}
                  onChange={(e) => onFormChange({ flag: e.target.value })}
                  placeholder="Enter the flag here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solution Notes (Optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => onFormChange({ notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Share your approach or methodology..."
                />
              </div>

              <div className="flex gap-3 pt-2">
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
                  {loading ? 'Submitting...' : 'Submit Flag'}
                </button>
              </div>
            </form>
          )}

          {challenge?.status === 'solved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="text-green-600 text-xl">✅</div>
                <div>
                  <h4 className="font-semibold text-green-800">Challenge Solved!</h4>
                  <p className="text-green-700 text-sm">
                    You've successfully completed this challenge and earned {challenge.points} points.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserChallenges;
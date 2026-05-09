import React, { useState, useEffect } from 'react';
import { challengeService } from '../../services/challengeService';
import { adminService } from '../../services/adminService';

const ChallengeManagement = () => {
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchChallenges();
    fetchStats();
  }, []);

  useEffect(() => {
    filterChallenges();
  }, [challenges, filters]);

  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await challengeService.getAllChallenges();
      setChallenges(data.challenges || data);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load challenges. Please try again.');
      // Fallback to empty array
      setChallenges([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await challengeService.getChallengeStats();
      setStats(data.overview || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const filterChallenges = () => {
    let filtered = [...challenges];

    if (filters.category) {
      filtered = filtered.filter(challenge => challenge.category === filters.category);
    }

    if (filters.difficulty) {
      filtered = filtered.filter(challenge => challenge.difficulty === filters.difficulty);
    }

    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filtered = filtered.filter(challenge => challenge.isActive);
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(challenge => !challenge.isActive);
      }
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(challenge =>
        challenge.title.toLowerCase().includes(searchLower) ||
        challenge.description.toLowerCase().includes(searchLower) ||
        (challenge.tags && challenge.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    setFilteredChallenges(filtered);
  };

  const handleCreateChallenge = async (challengeData) => {
    try {
      await challengeService.createChallenge(challengeData);
      setShowCreateForm(false);
      await fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  };

  const handleUpdateChallenge = async (challengeId, challengeData) => {
    try {
      await challengeService.updateChallenge(challengeId, challengeData);
      setEditingChallenge(null);
      await fetchChallenges();
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (window.confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      try {
        await challengeService.deleteChallenge(challengeId);
        await fetchChallenges();
      } catch (error) {
        console.error('Error deleting challenge:', error);
        alert('Failed to delete challenge. Please try again.');
      }
    }
  };

  const toggleChallengeStatus = async (challengeId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await challengeService.toggleChallengeStatus(challengeId, newStatus);
      await fetchChallenges();
    } catch (error) {
      console.error('Error updating challenge status:', error);
      alert('Failed to update challenge status. Please try again.');
    }
  };

  const resetChallenge = async (challengeId) => {
    if (window.confirm('Are you sure you want to reset this challenge? This will clear all submissions and solve counts.')) {
      try {
        await challengeService.resetChallenge(challengeId);
        await fetchChallenges();
        alert('Challenge reset successfully!');
      } catch (error) {
        console.error('Error resetting challenge:', error);
        alert('Failed to reset challenge. Please try again.');
      }
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'web': return 'bg-blue-100 text-blue-800';
      case 'crypto': return 'bg-purple-100 text-purple-800';
      case 'forensics': return 'bg-indigo-100 text-indigo-800';
      case 'pwn': return 'bg-red-100 text-red-800';
      case 'reverse': return 'bg-pink-100 text-pink-800';
      case 'misc': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPointsColor = (points) => {
    if (points >= 500) return 'text-red-600';
    if (points >= 250) return 'text-orange-600';
    if (points >= 100) return 'text-yellow-600';
    return 'text-green-600';
  };

  const categories = ['web', 'crypto', 'forensics', 'pwn', 'reverse', 'misc'];
  const difficulties = ['easy', 'medium', 'hard'];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 p-6 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="bg-gray-200 p-6 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Challenge Management</h1>
          <p className="text-gray-600">Create, edit, and manage CTF challenges</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="mt-4 lg:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Challenge</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={fetchChallenges}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-blue-600 mb-2">{stats.totalChallenges || 0}</div>
          <div className="text-sm text-gray-600">Total Challenges</div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {challenges.filter(c => c.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Challenges</div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {stats.correctSubmissions || 0}
          </div>
          <div className="text-sm text-gray-600">Total Solves</div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {Math.max(...challenges.map(c => c.points || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Max Points</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search challenges by title, description, or tags..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Challenges Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Challenges ({filteredChallenges.length})
          </h2>
          <button
            onClick={fetchChallenges}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Challenge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solves
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
              {filteredChallenges.map((challenge) => (
                <tr key={challenge._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {challenge.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {challenge.description}
                      </div>
                      {challenge.tags && challenge.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {challenge.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                          {challenge.tags.length > 3 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              +{challenge.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(challenge.category)}`}>
                      {challenge.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${getPointsColor(challenge.points)}`}>
                      {challenge.points}
                    </span>
                    {challenge.dynamicScoring && (
                      <div className="text-xs text-gray-500">Dynamic</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {challenge.solveCount || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(challenge.isActive)}`}>
                      {challenge.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingChallenge(challenge)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                        title="Edit Challenge"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => toggleChallengeStatus(challenge._id, challenge.isActive)}
                        className={`text-sm font-medium flex items-center space-x-1 ${
                          challenge.isActive 
                            ? 'text-orange-600 hover:text-orange-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={challenge.isActive ? 'Disable Challenge' : 'Enable Challenge'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {challenge.isActive ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          )}
                        </svg>
                        <span>{challenge.isActive ? 'Disable' : 'Enable'}</span>
                      </button>
                      <button
                        onClick={() => resetChallenge(challenge._id)}
                        className="text-yellow-600 hover:text-yellow-900 text-sm font-medium flex items-center space-x-1"
                        title="Reset Challenge"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Reset</span>
                      </button>
                      <button
                        onClick={() => handleDeleteChallenge(challenge._id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center space-x-1"
                        title="Delete Challenge"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredChallenges.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges found</h3>
              <p className="text-gray-500">
                {challenges.length === 0 
                  ? 'Get started by creating your first challenge.' 
                  : 'No challenges match your current filters.'
                }
              </p>
              {challenges.length === 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Create Challenge
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Challenge Form */}
      {(showCreateForm || editingChallenge) && (
        <ChallengeForm
          challenge={editingChallenge}
          onSubmit={editingChallenge ? 
            (data) => handleUpdateChallenge(editingChallenge._id, data) : 
            handleCreateChallenge
          }
          onCancel={() => {
            setShowCreateForm(false);
            setEditingChallenge(null);
          }}
        />
      )}
    </div>
  );
};

// Challenge Form Component
const ChallengeForm = ({ challenge, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: challenge?.title || '',
    description: challenge?.description || '',
    category: challenge?.category || 'web',
    difficulty: challenge?.difficulty || 'easy',
    points: challenge?.points || 100,
    flag: challenge?.flag || '',
    hint: challenge?.hint || '',
    tags: challenge?.tags || [],
    isActive: challenge?.isActive ?? true,
    dynamicScoring: challenge?.dynamicScoring || false,
    basePoints: challenge?.basePoints || 100,
    minPoints: challenge?.minPoints || 30,
    dockerImage: challenge?.dockerImage || '',
    validationType: challenge?.validationType || 'static',
    maxAttempts: challenge?.maxAttempts || 0,
    timeLimit: challenge?.timeLimit || 0
  });

  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      await onSubmit(formData);
    } catch (error) {
      setFormError(error.response?.data?.error || 'Failed to save challenge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const categories = ['web', 'crypto', 'forensics', 'pwn', 'reverse', 'misc'];
  const difficulties = ['easy', 'medium', 'hard'];
  const validationTypes = ['static', 'dynamic', 'manual'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {challenge ? 'Edit Challenge' : 'Create New Challenge'}
          </h2>
        </div>

        {formError && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{formError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter challenge title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the challenge..."
            />
          </div>

          {/* Difficulty and Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points *
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleChange}
                min="1"
                max="1000"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active Challenge</span>
              </label>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validation Type
                </label>
                <select
                  name="validationType"
                  value={formData.validationType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {validationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attempts (0 = unlimited)
                </label>
                <input
                  type="number"
                  name="maxAttempts"
                  value={formData.maxAttempts}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Docker Image
                </label>
                <input
                  type="text"
                  name="dockerImage"
                  value={formData.dockerImage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user/image:tag"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes, 0 = no limit)
                </label>
                <input
                  type="number"
                  name="timeLimit"
                  value={formData.timeLimit}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Dynamic Scoring */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  name="dynamicScoring"
                  checked={formData.dynamicScoring}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Dynamic Scoring</span>
              </label>
              
              {formData.dynamicScoring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Points
                    </label>
                    <input
                      type="number"
                      name="basePoints"
                      value={formData.basePoints}
                      onChange={handleChange}
                      min="1"
                      max="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Points
                    </label>
                    <input
                      type="number"
                      name="minPoints"
                      value={formData.minPoints}
                      onChange={handleChange}
                      min="1"
                      max={formData.basePoints}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Flag and Hints */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flag *
            </label>
            <input
              type="text"
              name="flag"
              value={formData.flag}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="CTF{...}"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hint
            </label>
            <textarea
              name="hint"
              value={formData.hint}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Optional hint for the challenge..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>{challenge ? 'Update Challenge' : 'Create Challenge'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallengeManagement;
import React, { useState, useEffect, useCallback } from 'react';
import { teamService } from '../../services/teamService';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Fetch teams from real API
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await teamService.getAllTeams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: filters.search
      });

      // Map backend response to frontend expected structure
      const rawTeams = response.teams || [];
      const paginationData = response.pagination || {};

      // Map backend team structure to frontend expected structure
      const allTeams = rawTeams.map(team => ({
        _id: team.id || team._id,
        id: team.id || team._id,
        name: team.name,
        description: team.description,
        members: team.members || [],
        memberCount: team.memberCount || team.members?.length || 0,
        score: team.score,
        totalPoints: team.score || 0,
        captain: team.captain,
        leader: team.captain,
        createdAt: team.createdAt,
        solvedCount: team.solvedCount,
        averageScore: team.averageScore
      }));

      // Update pagination with backend data
      setPagination(prev => ({
        ...prev,
        totalItems: paginationData.total || allTeams.length
      }));

      setTeams(allTeams);

    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load teams. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.search, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Team actions
  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsCreating(true);
    setShowTeamModal(true);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setIsCreating(false);
    setShowTeamModal(true);
  };

  const handleViewTeam = (team) => {
    setSelectedTeam(team);
    setIsCreating(false);
    setShowTeamModal(true);
  };

  const handleDeleteTeam = (team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const confirmDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      setActionLoading(true);
      await teamService.deleteTeam(selectedTeam._id || selectedTeam.id);
      await fetchTeams();
      setShowDeleteModal(false);
      setSelectedTeam(null);
    } catch (err) {
      console.error('Error deleting team:', err);
      setError(err.response?.data?.error || err.message || 'Failed to delete team. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTeam = async (teamData) => {
    try {
      setActionLoading(true);
      
      if (isCreating) {
        await teamService.createTeam(teamData);
      } else {
        await teamService.updateTeam(selectedTeam._id || selectedTeam.id, teamData);
      }
      
      await fetchTeams();
      setShowTeamModal(false);
      setSelectedTeam(null);
      setIsCreating(false);
    } catch (err) {
      console.error('Error saving team:', err);
      setError(err.response?.data?.error || err.message || `Failed to ${isCreating ? 'create' : 'update'} team. Please try again.`);
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
  const getTeamStats = () => {
    const total = pagination.totalItems;
    const totalMembers = teams.reduce((sum, team) => sum + (team.memberCount || 0), 0);
    const avgMembers = total > 0 ? (totalMembers / total).toFixed(1) : 0;
    const totalPoints = teams.reduce((sum, team) => sum + (team.totalPoints || 0), 0);
    const avgPoints = total > 0 ? (totalPoints / total).toFixed(0) : 0;

    return { total, totalMembers, avgMembers, totalPoints, avgPoints };
  };

  const stats = getTeamStats();

  if (loading && teams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading teams...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-2">
              Manage CTF teams, members, and team settings
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateTeam}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Team</span>
            </button>
            <button
              onClick={fetchTeams}
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
          <StatCard value={stats.total} label="Total Teams" color="blue" />
          <StatCard value={stats.totalMembers} label="Total Members" color="green" />
          <StatCard value={stats.avgMembers} label="Avg Members/Team" color="purple" />
          <StatCard value={stats.totalPoints} label="Total Points" color="orange" />
          <StatCard value={stats.avgPoints} label="Avg Points/Team" color="yellow" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Teams
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by team name or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                <option value="name">Team Name</option>
                <option value="totalPoints">Total Points</option>
                <option value="memberCount">Member Count</option>
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

        {/* Teams Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Captain
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
                {teams.map((team) => (
                  <TeamTableRow
                    key={team._id || team.id}
                    team={team}
                    onEdit={handleEditTeam}
                    onView={handleViewTeam}
                    onDelete={handleDeleteTeam}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {teams.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No teams found
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.search
                  ? 'No teams match your current filters.'
                  : 'Get started by creating your first team.'
                }
              </p>
              {filters.search ? (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={handleCreateTeam}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Create Team
                </button>
              )}
            </div>
          )}

          {/* Loading State for Table */}
          {loading && teams.length > 0 && (
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
              {pagination.totalItems} teams
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

        {/* Team Modal */}
        {showTeamModal && (
          <TeamModal
            team={selectedTeam}
            isCreating={isCreating}
            onClose={() => {
              setShowTeamModal(false);
              setSelectedTeam(null);
              setIsCreating(false);
            }}
            onSave={handleSaveTeam}
            loading={actionLoading}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteModal
            item={selectedTeam}
            itemName="team"
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedTeam(null);
            }}
            onConfirm={confirmDeleteTeam}
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

// Team Table Row Component
const TeamTableRow = ({ team, onEdit, onView, onDelete }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {team.name?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {team.name}
            </div>
            <div className="text-sm text-gray-500">
              {team.description || 'No description'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{team.memberCount || 0} members</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {team.totalPoints || 0}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {team.captain?.username || 'Unknown'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onView(team)}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View Team"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(team)}
            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
            title="Edit Team"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(team)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete Team"
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

// Team Modal Component
const TeamModal = ({ team, isCreating, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Team name is required');
      return;
    }
    
    onSave(formData);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isCreating ? 'Create New Team' : 'Edit Team'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength="3"
                maxLength="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter team name (3-50 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                maxLength="200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter team description (max 200 characters)"
              />
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
                disabled={loading}
              >
                {loading ? 'Saving...' : (isCreating ? 'Create Team' : 'Update Team')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal (Reusable)
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
            Are you sure you want to delete <strong>{item?.name}</strong>? This action cannot be undone.
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

export default TeamManagement;
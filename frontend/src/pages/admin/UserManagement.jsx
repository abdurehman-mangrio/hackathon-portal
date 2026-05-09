// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/userService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Fetch users from real API
  const fetchUsers = useCallback(async () => {
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
      if (filters.role !== 'all') {
        params.role = filters.role;
      }
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      const response = await userService.getUsers(params);
      
      setUsers(response.users || response.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: response.totalCount || response.total || 0
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // User actions
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsCreating(true);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsCreating(false);
    setShowUserModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsCreating(false);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await userService.deleteUser(selectedUser._id);
      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      setActionLoading(true);
      
      if (isCreating) {
        await userService.createUser(userData);
      } else {
        await userService.updateUser(selectedUser._id, userData);
      }
      
      await fetchUsers();
      setShowUserModal(false);
      setSelectedUser(null);
      setIsCreating(false);
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.message || `Failed to ${isCreating ? 'create' : 'update'} user. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await userService.changeUserStatus(user._id, newStatus);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      await userService.changeUserRole(user._id, newRole);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role.');
    }
  };

  // Pagination
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  // Stats
  const getUserStats = () => {
    const total = pagination.totalItems;
    const active = users.filter(u => u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const moderators = users.filter(u => u.role === 'moderator').length;
    const regularUsers = users.filter(u => u.role === 'user').length;

    return { total, active, inactive, admins, moderators, regularUsers };
  };

  const stats = getUserStats();

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading users...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              Manage system users, roles, and permissions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateUser}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add User</span>
            </button>
            <button
              onClick={fetchUsers}
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
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard value={stats.total} label="Total Users" color="blue" />
          <StatCard value={stats.active} label="Active" color="green" />
          <StatCard value={stats.inactive} label="Inactive" color="red" />
          <StatCard value={stats.admins} label="Admins" color="purple" />
          <StatCard value={stats.moderators} label="Moderators" color="orange" />
          <StatCard value={stats.regularUsers} label="Users" color="yellow" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search users..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                <option value="createdAt">Registration Date</option>
                <option value="username">Username</option>
                <option value="lastLogin">Last Login</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <UserTableRow
                    key={user._id}
                    user={user}
                    onEdit={handleEditUser}
                    onView={handleViewUser}
                    onDelete={handleDeleteUser}
                    onStatusToggle={handleStatusToggle}
                    onRoleChange={handleRoleChange}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.role !== 'all' || filters.status !== 'all'
                  ? 'No users match your current filters.'
                  : 'Get started by adding your first user.'
                }
              </p>
              {(filters.search || filters.role !== 'all' || filters.status !== 'all') && (
                <button
                  onClick={() => setFilters({ search: '', role: 'all', status: 'all', sortBy: 'createdAt', sortOrder: 'desc' })}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Loading State for Table */}
          {loading && users.length > 0 && (
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
              {pagination.totalItems} users
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

        {/* User Modal */}
        {showUserModal && (
          <UserModal
            user={selectedUser}
            isCreating={isCreating}
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
              setIsCreating(false);
            }}
            onSave={handleSaveUser}
            loading={actionLoading}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteModal
            user={selectedUser}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={confirmDeleteUser}
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

// User Table Row Component
const UserTableRow = ({ user, onEdit, onView, onDelete, onStatusToggle, onRoleChange }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.fullName || user.username || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={user.role}
          onChange={(e) => onRoleChange(user, e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onStatusToggle(user)}
          className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
            user.status === 'active' 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {user.status || 'active'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onView(user)}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View User"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(user)}
            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
            title="Edit User"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(user)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete User"
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

// User Modal Component
const UserModal = ({ user, isCreating, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    role: user?.role || 'user',
    status: user?.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isCreating ? 'Add New User' : 'Edit User'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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
                {loading ? 'Saving...' : (isCreating ? 'Create User' : 'Update User')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ user, onClose, onConfirm, loading }) => {
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
            Delete User
          </h2>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete <strong>{user?.username}</strong>? This action cannot be undone.
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
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
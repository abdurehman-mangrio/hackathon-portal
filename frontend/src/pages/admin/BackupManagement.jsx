import React, { useState, useEffect } from 'react';
import { backupService } from '../../services/backupService';

const BackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const data = await backupService.getBackups();
      setBackups(data);
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      await backupService.createBackup();
      await fetchBackups(); // Refresh the list
    } catch (error) {
      console.error('Error creating backup:', error);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will replace current data.')) {
      return;
    }

    setRestoreProgress({ backupId, progress: 0, status: 'starting' });
    
    try {
      // Simulate restore progress
      const progressInterval = setInterval(() => {
        setRestoreProgress(prev => {
          if (prev.progress >= 90) {
            clearInterval(progressInterval);
            return { ...prev, progress: 90, status: 'finalizing' };
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 200);

      await backupService.restoreBackup(backupId);
      
      clearInterval(progressInterval);
      setRestoreProgress({ backupId, progress: 100, status: 'completed' });
      
      setTimeout(() => {
        setRestoreProgress(null);
        // Refresh the page or show success message
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error restoring backup:', error);
      setRestoreProgress({ backupId, progress: 0, status: 'error', error: error.message });
    }
  };

  const handleDownloadBackup = async (backupId, filename) => {
    try {
      const blob = await backupService.downloadBackup(backupId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      await backupService.deleteBackup(backupId);
      await fetchBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading backups...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Backup Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, restore, and manage system backups
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
          >
            {creatingBackup ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Create Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backup Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-500 mb-2">
            {backups.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Backups</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-500 mb-2">
            {formatFileSize(backups.reduce((total, backup) => total + backup.size, 0))}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Size</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-500 mb-2">
            {backups.filter(b => b.type === 'automatic').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Automatic</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-orange-500 mb-2">
            {backups.filter(b => b.type === 'manual').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Manual</div>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Available Backups
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {backups.map((backup) => (
                <tr key={backup._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {backup.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {backup.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      backup.type === 'automatic' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {backup.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {formatFileSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(backup.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      backup.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : backup.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownloadBackup(backup._id, backup.name)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Download"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRestoreBackup(backup._id)}
                        disabled={restoreProgress?.backupId === backup._id}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Restore"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup._id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Restore Progress */}
                    {restoreProgress?.backupId === backup._id && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${restoreProgress.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {restoreProgress.status === 'completed' 
                            ? 'Restore completed!' 
                            : `Restoring... ${restoreProgress.progress}%`
                          }
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {backups.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">💾</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No backups available
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create your first backup to protect your data.
              </p>
              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Create Backup
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backup Settings */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Automatic Backup Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Automatic Backup Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Automatic Backups
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically create backups daily at 2:00 AM
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Retention
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="7">Keep for 7 days</option>
                <option value="30">Keep for 30 days</option>
                <option value="90">Keep for 90 days</option>
                <option value="365">Keep for 1 year</option>
              </select>
            </div>

            <button className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors duration-200 font-medium">
              Save Settings
            </button>
          </div>
        </div>

        {/* Backup Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Backup Information
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Backup</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {backups.length > 0 ? formatDate(backups[0].createdAt) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Next Automatic Backup</span>
              <span className="text-gray-900 dark:text-white font-medium">
                Tomorrow, 2:00 AM
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Storage Used</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatFileSize(backups.reduce((total, backup) => total + backup.size, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Backup Location</span>
              <span className="text-gray-900 dark:text-white font-medium">
                /var/backups/ctf-platform
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                Backups are stored locally. Consider implementing off-site backup solutions for disaster recovery.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManagement;
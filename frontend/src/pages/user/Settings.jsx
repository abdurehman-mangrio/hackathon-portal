// src/pages/user/Settings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

const UserSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    fullName: '',
    bio: '',
    country: '',
    website: '',
    github: '',
    twitter: ''
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferencesForm, setPreferencesForm] = useState({
    emailNotifications: true,
    securityAlerts: true,
    newsletter: false,
    publicProfile: true,
    showEmail: false,
    language: 'en',
    theme: 'system'
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        bio: user.bio || '',
        country: user.country || '',
        website: user.website || '',
        github: user.github || '',
        twitter: user.twitter || ''
      });

      setPreferencesForm({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        securityAlerts: user.preferences?.securityAlerts ?? true,
        newsletter: user.preferences?.newsletter ?? false,
        publicProfile: user.preferences?.publicProfile ?? true,
        showEmail: user.preferences?.showEmail ?? false,
        language: user.preferences?.language || 'en',
        theme: user.preferences?.theme || 'system'
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updatedUser = await userService.updateProfile(profileForm);
      updateUser(updatedUser);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await userService.changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword
      });

      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password updated successfully!');
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updatedUser = await userService.updatePreferences(preferencesForm);
      updateUser(updatedUser);
      setSuccess('Preferences updated successfully!');
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.message || 'Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Messages */}
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
                onClick={clearMessages}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
              <button
                onClick={clearMessages}
                className="text-green-500 hover:text-green-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'profile', name: 'Profile', icon: '👤' },
                { id: 'security', name: 'Security', icon: '🔒' },
                { id: 'preferences', name: 'Preferences', icon: '⚙️' },
                { id: 'notifications', name: 'Notifications', icon: '🔔' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-lg mb-1">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <ProfileTab
                form={profileForm}
                loading={loading}
                onChange={setProfileForm}
                onSubmit={handleProfileUpdate}
              />
            )}

            {activeTab === 'security' && (
              <SecurityTab
                form={securityForm}
                loading={loading}
                onChange={setSecurityForm}
                onSubmit={handleSecurityUpdate}
              />
            )}

            {activeTab === 'preferences' && (
              <PreferencesTab
                form={preferencesForm}
                loading={loading}
                onChange={setPreferencesForm}
                onSubmit={handlePreferencesUpdate}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab
                form={preferencesForm}
                loading={loading}
                onChange={setPreferencesForm}
                onSubmit={handlePreferencesUpdate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Tab Component
const ProfileTab = ({ form, loading, onChange, onSubmit }) => {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Social Links</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub
              </label>
              <input
                type="text"
                value={form.github}
                onChange={(e) => handleChange('github', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter
              </label>
              <input
                type="text"
                value={form.twitter}
                onChange={(e) => handleChange('twitter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="username"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
};

// Security Tab Component
const SecurityTab = ({ form, loading, onChange, onSubmit }) => {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              required
              minLength="8"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
};

// Preferences Tab Component
const PreferencesTab = ({ form, loading, onChange, onSubmit }) => {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Preferences</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Privacy</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.publicProfile}
                  onChange={(e) => handleChange('publicProfile', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Make profile public</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.showEmail}
                  onChange={(e) => handleChange('showEmail', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Show email on public profile</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Interface</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={form.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={form.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
};

// Notifications Tab Component
const NotificationsTab = ({ form, loading, onChange, onSubmit }) => {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Email Notifications</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Challenge Notifications</div>
                  <div className="text-sm text-gray-500">Get notified about new challenges and events</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Security Alerts</div>
                  <div className="text-sm text-gray-500">Important security and account notifications</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.securityAlerts}
                  onChange={(e) => handleChange('securityAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Newsletter</div>
                  <div className="text-sm text-gray-500">Monthly updates and platform news</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.newsletter}
                  onChange={(e) => handleChange('newsletter', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Save Notifications'}
        </button>
      </div>
    </form>
  );
};

export default UserSettings;
import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState({});

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setSaveStatus('load-error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleEmailChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [field]: value
      }
    }));
  };

  const validateSettings = () => {
    const newErrors = {};

    if (settings.maxLoginAttempts < 1 || settings.maxLoginAttempts > 10) {
      newErrors.maxLoginAttempts = 'Must be between 1 and 10';
    }

    if (settings.minPasswordLength < 6 || settings.minPasswordLength > 32) {
      newErrors.minPasswordLength = 'Must be between 6 and 32 characters';
    }

    if (settings.teamSizeLimit < 1 || settings.teamSizeLimit > 10) {
      newErrors.teamSizeLimit = 'Must be between 1 and 10';
    }

    if (settings.challengePointsBase < 50 || settings.challengePointsBase > 1000) {
      newErrors.challengePointsBase = 'Must be between 50 and 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!validateSettings()) {
      setSaveStatus('validation-error');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setSaving(true);
    setSaveStatus('saving');

    try {
      await settingsService.updateSettings(settings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      try {
        setSaving(true);
        const data = await settingsService.resetSettings();
        setSettings(data.settings);
        setSaveStatus('reset');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (error) {
        console.error('Error resetting settings:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 3000);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleTestEmail = async () => {
    if (!settings.email.smtpHost || !settings.email.smtpUsername) {
      setSaveStatus('email-config-required');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      setSaving(true);
      await settingsService.testEmail(settings.adminEmail);
      setSaveStatus('email-test-success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error testing email:', error);
      setSaveStatus('email-test-error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportSettings = async () => {
    try {
      const blob = await settingsService.exportSettings();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting settings:', error);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'ctf', name: 'CTF Settings', icon: '🚩' },
    { id: 'email', name: 'Email', icon: '✉️' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'maintenance', name: 'Maintenance', icon: '🔧' },
  ];

  const getSaveStatusConfig = () => {
    switch (saveStatus) {
      case 'saving': return { text: 'Saving changes...', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
      case 'saved': return { text: 'Settings saved successfully!', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'reset': return { text: 'Settings reset to default!', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'load-error': return { text: 'Error loading settings!', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      case 'error': return { text: 'Error saving settings!', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      case 'validation-error': return { text: 'Please fix validation errors!', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      case 'email-test-success': return { text: 'Email test sent successfully!', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'email-test-error': return { text: 'Email test failed!', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      case 'email-config-required': return { text: 'Please configure email settings first!', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      default: return { text: '', color: '', bgColor: '', borderColor: '' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading system settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load settings</h2>
          <p className="text-gray-600 mb-4">Unable to load system settings from the server.</p>
          <button
            onClick={loadSettings}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getSaveStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-2">
              Configure platform settings and preferences
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportSettings}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
            <button
              onClick={handleResetSettings}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div className={`mb-6 p-4 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
            <div className="flex items-center">
              {saveStatus === 'saving' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              )}
              {(saveStatus === 'saved' || saveStatus === 'reset' || saveStatus === 'email-test-success') && (
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {(saveStatus.includes('error') || saveStatus === 'email-config-required') && (
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className={statusConfig.color}>{statusConfig.text}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingInput
                    label="Site Name"
                    type="text"
                    value={settings.siteName}
                    onChange={(value) => handleInputChange('siteName', value)}
                    error={errors.siteName}
                  />
                  <SettingInput
                    label="Admin Email"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(value) => handleInputChange('adminEmail', value)}
                    error={errors.adminEmail}
                  />
                  <SettingInput
                    label="Site Description"
                    type="textarea"
                    value={settings.siteDescription}
                    onChange={(value) => handleInputChange('siteDescription', value)}
                    error={errors.siteDescription}
                  />
                  <SettingSelect
                    label="Timezone"
                    value={settings.timezone}
                    onChange={(value) => handleInputChange('timezone', value)}
                    options={[
                      { value: 'UTC', label: 'UTC' },
                      { value: 'EST', label: 'Eastern Time' },
                      { value: 'PST', label: 'Pacific Time' },
                      { value: 'CET', label: 'Central European Time' },
                    ]}
                  />
                  <SettingSelect
                    label="Language"
                    value={settings.language}
                    onChange={(value) => handleInputChange('language', value)}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingInput
                    label="Max Login Attempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(value) => handleInputChange('maxLoginAttempts', parseInt(value))}
                    error={errors.maxLoginAttempts}
                    min="1"
                    max="10"
                  />
                  <SettingInput
                    label="Session Timeout (minutes)"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(value) => handleInputChange('sessionTimeout', parseInt(value))}
                    error={errors.sessionTimeout}
                    min="5"
                    max="1440"
                  />
                  <SettingInput
                    label="Minimum Password Length"
                    type="number"
                    value={settings.minPasswordLength}
                    onChange={(value) => handleInputChange('minPasswordLength', parseInt(value))}
                    error={errors.minPasswordLength}
                    min="6"
                    max="32"
                  />
                  <SettingToggle
                    label="Require Email Verification"
                    description="Users must verify their email address before accessing the platform"
                    checked={settings.requireEmailVerification}
                    onChange={(checked) => handleInputChange('requireEmailVerification', checked)}
                  />
                  <SettingToggle
                    label="Allow New Registrations"
                    description="Allow new users to register accounts"
                    checked={settings.allowRegistrations}
                    onChange={(checked) => handleInputChange('allowRegistrations', checked)}
                  />
                </div>
              </div>
            )}

            {/* CTF Settings */}
            {activeTab === 'ctf' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">CTF Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingSelect
                    label="CTF Mode"
                    value={settings.ctfMode}
                    onChange={(value) => handleInputChange('ctfMode', value)}
                    options={[
                      { value: 'practice', label: 'Practice Mode' },
                      { value: 'competition', label: 'Competition Mode' },
                      { value: 'maintenance', label: 'Maintenance Mode' },
                    ]}
                  />
                  <SettingInput
                    label="Team Size Limit"
                    type="number"
                    value={settings.teamSizeLimit}
                    onChange={(value) => handleInputChange('teamSizeLimit', parseInt(value))}
                    error={errors.teamSizeLimit}
                    min="1"
                    max="10"
                  />
                  <SettingSelect
                    label="Scoring Type"
                    value={settings.scoringType}
                    onChange={(value) => handleInputChange('scoringType', value)}
                    options={[
                      { value: 'static', label: 'Static Scoring' },
                      { value: 'dynamic', label: 'Dynamic Scoring' },
                    ]}
                  />
                  <SettingInput
                    label="Challenge Points Base"
                    type="number"
                    value={settings.challengePointsBase}
                    onChange={(value) => handleInputChange('challengePointsBase', parseInt(value))}
                    error={errors.challengePointsBase}
                    min="50"
                    max="1000"
                  />
                  <SettingToggle
                    label="Show Leaderboard"
                    description="Display the leaderboard to all users"
                    checked={settings.showLeaderboard}
                    onChange={(checked) => handleInputChange('showLeaderboard', checked)}
                  />
                  <SettingToggle
                    label="Allow Team Creation"
                    description="Allow users to create and join teams"
                    checked={settings.allowTeamCreation}
                    onChange={(checked) => handleInputChange('allowTeamCreation', checked)}
                  />
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingInput
                    label="SMTP Host"
                    type="text"
                    value={settings.email.smtpHost}
                    onChange={(value) => handleEmailChange('smtpHost', value)}
                    placeholder="smtp.example.com"
                  />
                  <SettingInput
                    label="SMTP Port"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(value) => handleEmailChange('smtpPort', parseInt(value))}
                    min="1"
                    max="65535"
                  />
                  <SettingInput
                    label="SMTP Username"
                    type="text"
                    value={settings.email.smtpUsername}
                    onChange={(value) => handleEmailChange('smtpUsername', value)}
                    placeholder="username"
                  />
                  <SettingInput
                    label="SMTP Password"
                    type="password"
                    value={settings.email.smtpPassword}
                    onChange={(value) => handleEmailChange('smtpPassword', value)}
                    placeholder="••••••••"
                  />
                  <SettingInput
                    label="From Email"
                    type="email"
                    value={settings.email.emailFrom}
                    onChange={(value) => handleEmailChange('emailFrom', value)}
                    placeholder="noreply@example.com"
                  />
                  <SettingToggle
                    label="Enable Email System"
                    description="Enable email notifications and system"
                    checked={settings.email.emailEnabled}
                    onChange={(checked) => handleEmailChange('emailEnabled', checked)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {settings.email.smtpHost && settings.email.smtpUsername ? 
                      'Email configuration looks good' : 
                      'Configure SMTP settings to enable email functionality'
                    }
                  </div>
                  <button
                    onClick={handleTestEmail}
                    disabled={saving || !settings.email.smtpHost}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                  >
                    Test Email
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Appearance Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingSelect
                    label="Theme"
                    value={settings.theme}
                    onChange={(value) => handleInputChange('theme', value)}
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'auto', label: 'Auto (System)' },
                    ]}
                  />
                  <SettingInput
                    label="Primary Color"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(value) => handleInputChange('primaryColor', value)}
                  />
                  <SettingToggle
                    label="Enable Animations"
                    description="Enable smooth animations throughout the platform"
                    checked={settings.enableAnimations}
                    onChange={(checked) => handleInputChange('enableAnimations', checked)}
                  />
                </div>
              </div>
            )}

            {/* Maintenance Settings */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Maintenance Settings</h2>
                <div className="grid grid-cols-1 gap-6">
                  <SettingToggle
                    label="Maintenance Mode"
                    description="Put the platform in maintenance mode. Only administrators will be able to access the site."
                    checked={settings.maintenanceMode}
                    onChange={(checked) => handleInputChange('maintenanceMode', checked)}
                  />
                  <SettingInput
                    label="Maintenance Message"
                    type="textarea"
                    value={settings.maintenanceMessage}
                    onChange={(value) => handleInputChange('maintenanceMessage', value)}
                    placeholder="Message to display to users during maintenance"
                    rows={4}
                  />
                </div>
                {settings.maintenanceMode && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Maintenance Mode Active</h4>
                        <p className="text-sm text-yellow-600 mt-1">
                          The platform is currently in maintenance mode. Regular users cannot access the site.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Setting Components
const SettingInput = ({ label, type, value, onChange, placeholder, min, max, rows, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows || 3}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
    )}
    {error && (
      <p className="text-red-600 text-sm mt-1">{error}</p>
    )}
  </div>
);

const SettingSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const SettingToggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-start space-x-3">
    <div className="flex items-center h-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
    </div>
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {description && (
        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      )}
    </div>
  </div>
);

export default SystemSettings;
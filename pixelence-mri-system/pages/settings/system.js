// pages/settings/system.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';

const SystemSettings = () => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    emailNotifications: true,
    autoBackup: true,
    logRetentionDays: 30,
    maxFileSize: 100,
    apiRateLimit: 1000,
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);
  }, []);

  const handleSettingChange = (setting, value) => {
    setSettings({
      ...settings,
      [setting]: value,
    });
  };

  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    alert('System settings saved successfully!');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
            <Button onClick={handleSaveSettings}>
              Save Changes
            </Button>
          </div>

          <div className="mt-6 space-y-6">
            {/* General Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Maintenance Mode</h3>
                    <p className="text-sm text-gray-500">Put the system in maintenance mode</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="maintenanceMode"
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Send system notifications via email</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="emailNotifications"
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Automatic Backup</h3>
                    <p className="text-sm text-gray-500">Enable automatic daily backups</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="autoBackup"
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      checked={settings.autoBackup}
                      onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="logRetention" className="block text-sm font-medium text-gray-700">
                    Log Retention (days)
                  </label>
                  <input
                    id="logRetention"
                    type="number"
                    className="mt-1 form-input"
                    value={settings.logRetentionDays}
                    onChange={(e) => handleSettingChange('logRetentionDays', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700">
                    Max File Size (MB)
                  </label>
                  <input
                    id="maxFileSize"
                    type="number"
                    className="mt-1 form-input"
                    value={settings.maxFileSize}
                    onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label htmlFor="apiRateLimit" className="block text-sm font-medium text-gray-700">
                    API Rate Limit (requests/minute)
                  </label>
                  <input
                    id="apiRateLimit"
                    type="number"
                    className="mt-1 form-input"
                    value={settings.apiRateLimit}
                    onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
                    min="10"
                    max="10000"
                  />
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Version</dt>
                  <dd className="text-sm text-gray-900">Pixelence MRI v2.1.0</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Database</dt>
                  <dd className="text-sm text-gray-900">PostgreSQL 14.2</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Storage</dt>
                  <dd className="text-sm text-gray-900">2.4 TB / 5.0 TB used</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Uptime</dt>
                  <dd className="text-sm text-gray-900">127 days, 8 hours</dd>
                </div>
              </dl>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-red-900">Reset System</h3>
                  <p className="text-sm text-red-700 mb-2">
                    This will reset all system settings to default values. This action cannot be undone.
                  </p>
                  <Button variant="danger" size="sm" onClick={() => alert('Reset functionality would be implemented here')}>
                    Reset System
                  </Button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-red-900">Clear All Data</h3>
                  <p className="text-sm text-red-700 mb-2">
                    This will permanently delete all data from the system. This action cannot be undone.
                  </p>
                  <Button variant="danger" size="sm" onClick={() => alert('Data clearing functionality would be implemented here')}>
                    Clear All Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SystemSettings;

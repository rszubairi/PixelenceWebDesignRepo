// pages/settings/license.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';

const LicenseManagement = () => {
  const [user, setUser] = useState(null);
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Mock license data
    const mockLicense = {
      key: 'PXLC-MRI-2023-ENT-001',
      type: 'Enterprise',
      status: 'Active',
      issuedDate: '2023-01-15T00:00:00',
      expiryDate: '2024-01-15T23:59:59',
      maxUsers: 50,
      currentUsers: 24,
      features: [
        'AI Analysis Engine',
        'DICOM Processing',
        'Multi-user Support',
        'Advanced Reporting',
        'Cloud Storage Integration',
        'API Access',
        'Priority Support'
      ],
      organization: 'General Hospital',
      contactEmail: 'admin@hospital.com',
      autoRenewal: true,
    };
    setLicense(mockLicense);
    setLoading(false);
  }, []);

  const getDaysUntilExpiry = () => {
    const expiry = new Date(license.expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = () => {
    const days = getDaysUntilExpiry();
    if (days < 0) return { status: 'Expired', color: 'red' };
    if (days <= 30) return { status: 'Expiring Soon', color: 'yellow' };
    return { status: 'Active', color: 'green' };
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const expiryInfo = getExpiryStatus();

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">License Management</h1>
            <Button onClick={() => alert('License renewal functionality would be implemented here')}>
              Renew License
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* License Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">License Details</h2>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">License Key:</dt>
                  <dd className="text-sm text-gray-900 font-mono">{license.key}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Type:</dt>
                  <dd className="text-sm text-gray-900">{license.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status:</dt>
                  <dd className="text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      expiryInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                      expiryInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {expiryInfo.status}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Issued Date:</dt>
                  <dd className="text-sm text-gray-900">{new Date(license.issuedDate).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Expiry Date:</dt>
                  <dd className="text-sm text-gray-900">{new Date(license.expiryDate).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Days Remaining:</dt>
                  <dd className={`text-sm font-medium ${
                    expiryInfo.color === 'green' ? 'text-green-600' :
                    expiryInfo.color === 'yellow' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {Math.max(0, getDaysUntilExpiry())} days
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Auto Renewal:</dt>
                  <dd className="text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      license.autoRenewal ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {license.autoRenewal ? 'Enabled' : 'Disabled'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h2>
              <dl className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <dt className="font-medium text-gray-500">User Usage:</dt>
                    <dd className="text-gray-900">{license.currentUsers} / {license.maxUsers}</dd>
                  </div>
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(license.currentUsers / license.maxUsers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Organization:</dt>
                  <dd className="text-sm text-gray-900">{license.organization}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Contact Email:</dt>
                  <dd className="text-sm text-gray-900">{license.contactEmail}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Licensed Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {license.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* License Actions */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">License Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" onClick={() => alert('License key regeneration would be implemented here')}>
                Regenerate License Key
              </Button>
              <Button variant="secondary" onClick={() => alert('License transfer functionality would be implemented here')}>
                Transfer License
              </Button>
              <Button variant="secondary" onClick={() => alert('License history would be displayed here')}>
                View License History
              </Button>
              <Button variant="danger" onClick={() => alert('License deactivation would be implemented here')}>
                Deactivate License
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LicenseManagement;

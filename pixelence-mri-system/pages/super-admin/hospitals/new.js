// pages/super-admin/hospitals/new.js
import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { anyApi } from 'convex/server';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

export default function NewHospital() {
  const { user } = useAuth();
  const router = useRouter();

  const createHospital = useMutation(anyApi.hospitals.create);
  const generateLicense = useMutation(anyApi.licenses.generate);

  const [step, setStep] = useState(1); // 1 = hospital info, 2 = license config
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdHospitalId, setCreatedHospitalId] = useState(null);
  const [generatedKey, setGeneratedKey] = useState('');

  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
  });

  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [licenseForm, setLicenseForm] = useState({
    billingType: 'monthly-fixed',
    perScanRate: '',
    monthlyRate: '',
    minimumScans: '',
    startDate: today,
    expiryDate: oneYearLater,
  });

  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const hospitalId = await createHospital(hospitalForm);
      setCreatedHospitalId(hospitalId);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to create hospital');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const args = {
        hospitalId: createdHospitalId,
        billingType: licenseForm.billingType,
        startDate: licenseForm.startDate,
        expiryDate: licenseForm.expiryDate,
      };

      if (licenseForm.billingType === 'per-scan') {
        args.perScanRate = parseFloat(licenseForm.perScanRate);
      } else {
        args.monthlyRate = parseFloat(licenseForm.monthlyRate);
        args.minimumScans = parseInt(licenseForm.minimumScans, 10);
      }

      const licenseId = await generateLicense(args);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to generate license');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super-admin']}>
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Progress steps */}
            <div className="mb-8">
              <nav aria-label="Progress">
                <ol className="flex items-center">
                  {['Hospital Info', 'License Config', 'Done'].map((label, idx) => (
                    <li key={label} className={`${idx < 2 ? 'flex-1' : ''} relative`}>
                      <div className="flex items-center">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                          step > idx + 1 ? 'bg-purple-600 text-white' :
                          step === idx + 1 ? 'border-2 border-purple-600 text-purple-600' :
                          'border-2 border-gray-300 text-gray-500'
                        }`}>
                          {step > idx + 1 ? '✓' : idx + 1}
                        </span>
                        <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
                        {idx < 2 && <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>}
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Hospital Info */}
            {step === 1 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Hospital Information</h2>
                <form onSubmit={handleHospitalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hospital Name *</label>
                    <input
                      type="text"
                      required
                      value={hospitalForm.name}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                      placeholder="e.g. City General Hospital"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address *</label>
                    <input
                      type="text"
                      required
                      value={hospitalForm.address}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                      placeholder="123 Main St, City, Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={hospitalForm.contactEmail}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, contactEmail: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                      placeholder="admin@hospital.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={hospitalForm.contactPhone}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, contactPhone: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                      placeholder="+1 555 000 0000"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/super-admin/hospitals')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300"
                    >
                      {loading ? 'Creating...' : 'Next: Configure License'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: License Config */}
            {step === 2 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">License Configuration</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Hospital: <strong>{hospitalForm.name}</strong>
                </p>
                <form onSubmit={handleLicenseSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Billing Type *</label>
                    <select
                      value={licenseForm.billingType}
                      onChange={(e) => setLicenseForm({ ...licenseForm, billingType: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                    >
                      <option value="monthly-fixed">Monthly Fixed (minimum scans)</option>
                      <option value="per-scan">Per Scan Rate</option>
                    </select>
                  </div>

                  {licenseForm.billingType === 'per-scan' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rate per Scan ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={licenseForm.perScanRate}
                        onChange={(e) => setLicenseForm({ ...licenseForm, perScanRate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                        placeholder="e.g. 25.00"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Monthly Rate ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={licenseForm.monthlyRate}
                          onChange={(e) => setLicenseForm({ ...licenseForm, monthlyRate: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                          placeholder="e.g. 1500.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Minimum Scans per Month *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={licenseForm.minimumScans}
                          onChange={(e) => setLicenseForm({ ...licenseForm, minimumScans: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                          placeholder="e.g. 50"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={licenseForm.startDate}
                        onChange={(e) => setLicenseForm({ ...licenseForm, startDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiry Date *</label>
                      <input
                        type="date"
                        required
                        value={licenseForm.expiryDate}
                        onChange={(e) => setLicenseForm({ ...licenseForm, expiryDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300"
                    >
                      {loading ? 'Generating License...' : 'Generate License & Finish'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Hospital Created Successfully</h2>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{hospitalForm.name}</strong> has been added to Pixelence with an active license.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Next step: go to the hospital detail page to create the hospital admin user.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => router.push(`/super-admin/hospitals/${createdHospitalId}`)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    Manage Hospital
                  </button>
                  <button
                    onClick={() => router.push('/super-admin/hospitals')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back to Hospitals
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}

// pages/dashboard/super-admin.js
import React from 'react';
import { useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const hospitalStats = useQuery(anyApi.hospitals.getStats, {}) || { total: 0, active: 0, suspended: 0 };
  const hospitals = useQuery(anyApi.hospitals.list, {}) || [];
  const expiringLicenses = useQuery(anyApi.licenses.getExpiringLicenses, { daysAhead: 30 }) || [];

  return (
    <ProtectedRoute allowedRoles={['super-admin']}>
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Pixelence Admin</h1>
                <p className="mt-1 text-sm text-gray-600">System-wide hospital management</p>
              </div>
              <Link href="/super-admin/hospitals/new" legacyBehavior>
                <a className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
                  + Add Hospital
                </a>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Total Hospitals</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{hospitalStats.total}</dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Active</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{hospitalStats.active}</dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Suspended</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{hospitalStats.suspended}</dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Expiring (30d)</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{expiringLicenses.length}</dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expiring Licenses Alert */}
            {expiringLicenses.length > 0 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Licenses Expiring Soon</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      {expiringLicenses.length} license{expiringLicenses.length > 1 ? 's' : ''} will expire within 30 days. Review and renew them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hospitals Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Hospitals</h2>
                <Link href="/super-admin/hospitals" legacyBehavior>
                  <a className="text-sm text-purple-600 hover:text-purple-500">View all</a>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hospitals.slice(0, 5).map((hospital) => (
                      <tr key={hospital._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                          <div className="text-sm text-gray-500">{hospital.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{hospital.contactEmail}</div>
                          <div className="text-sm text-gray-500">{hospital.contactPhone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            hospital.status === 'active' ? 'bg-green-100 text-green-800' :
                            hospital.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {hospital.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {hospital.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/super-admin/hospitals/${hospital._id}`} legacyBehavior>
                            <a className="text-purple-600 hover:text-purple-900">Manage</a>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {hospitals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                          No hospitals yet.{' '}
                          <Link href="/super-admin/hospitals/new" legacyBehavior>
                            <a className="text-purple-600 hover:text-purple-500">Add the first hospital</a>
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}

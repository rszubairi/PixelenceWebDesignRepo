// pages/dashboard/hospital-admin.js
import React from 'react';
import { useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function HospitalAdminDashboard() {
  const { user } = useAuth();

  const hospital = useQuery(
    anyApi.hospitals.getById,
    user?.hospitalId ? { hospitalId: user.hospitalId } : 'skip'
  );
  const license = useQuery(
    anyApi.licenses.getByHospital,
    user?.hospitalId ? { hospitalId: user.hospitalId } : 'skip'
  );
  const hospitalUsers = useQuery(
    anyApi.users.listByHospital,
    user?.hospitalId ? { hospitalId: user.hospitalId } : 'skip'
  ) || [];
  const appointments = useQuery(
    anyApi.appointments.list,
    user?.hospitalId ? { hospitalId: user.hospitalId } : 'skip'
  ) || [];
  const jobs = useQuery(
    anyApi.jobs.getRecentJobs,
    user?.hospitalId ? { hospitalId: user.hospitalId, limit: 5 } : 'skip'
  ) || [];

  const activeStaff = hospitalUsers.filter((u) => u.isActive).length;
  const pendingCases = appointments.filter((a) => a.status !== 'Completed' && a.status !== 'Cancelled').length;
  const completedToday = appointments.filter((a) => {
    if (a.status !== 'Completed') return false;
    const updated = a.updatedAt || a.createdAt;
    return updated && new Date(updated).toDateString() === new Date().toDateString();
  }).length;

  const daysUntilExpiry = license
    ? Math.ceil((new Date(license.expiryDate) - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <ProtectedRoute allowedRoles={['hospital-admin']}>
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                {hospital?.name || 'Hospital Admin'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">Welcome back, {user?.firstName}</p>
            </div>

            {/* License expiry warning */}
            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    Your Pixelence license expires in <strong>{daysUntilExpiry} days</strong>. Contact Pixelence support to renew.
                  </p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Active Staff</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{activeStaff}</dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Active Cases</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{pendingCases}</dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Completed Today</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{completedToday}</dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Link href="/settings/hospital-users" legacyBehavior>
                <a className="bg-white shadow rounded-lg p-5 hover:shadow-md transition-shadow flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Manage Staff</p>
                    <p className="text-xs text-gray-500">Add or deactivate hospital staff users</p>
                  </div>
                </a>
              </Link>
              <Link href="/appointments" legacyBehavior>
                <a className="bg-white shadow rounded-lg p-5 hover:shadow-md transition-shadow flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">View Appointments</p>
                    <p className="text-xs text-gray-500">Track all patient appointments</p>
                  </div>
                </a>
              </Link>
              <Link href="/reports" legacyBehavior>
                <a className="bg-white shadow rounded-lg p-5 hover:shadow-md transition-shadow flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">View Reports</p>
                    <p className="text-xs text-gray-500">Access all submitted MRI reports</p>
                  </div>
                </a>
              </Link>
              <Link href="/settings/license" legacyBehavior>
                <a className="bg-white shadow rounded-lg p-5 hover:shadow-md transition-shadow flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">License</p>
                    <p className="text-xs text-gray-500">
                      {license ? `Expires ${new Date(license.expiryDate).toLocaleDateString()}` : 'No active license'}
                    </p>
                  </div>
                </a>
              </Link>
            </div>

            {/* Recent Jobs */}
            {jobs.length > 0 && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Recent Cases</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <div key={job._id} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Job {job._id.slice(-8)}</p>
                        <p className="text-xs text-gray-500">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                        job.status === 'DICOM Uploaded' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  ))}
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

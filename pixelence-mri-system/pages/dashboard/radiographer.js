// pages/dashboard/radiographer.js
import React from 'react';
import { useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';

const RadiographerDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();

  const jobs = useQuery(
    anyApi.jobs.getRecentJobs,
    user?.hospitalId ? { hospitalId: user.hospitalId } : {}
  ) || [];

  const scheduledJobs = jobs.filter((j) => j.status === 'Scheduled');
  const uploadedToday = jobs.filter((j) => {
    if (j.status !== 'DICOM Uploaded') return false;
    const d = j.updatedAt || j.createdAt;
    return d && new Date(d).toDateString() === new Date().toDateString();
  });
  const completedScans = jobs.filter((j) => j.status === 'Completed' || j.status === 'DICOM Uploaded').length;

  return (
    <ProtectedRoute allowedRoles={['radiographer']}>
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Radiographer Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.firstName} {user?.lastName}. Here's your imaging workflow overview.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Scans Today</p>
                    <p className="text-2xl font-semibold text-gray-900">{uploadedToday.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Uploads</p>
                    <p className="text-2xl font-semibold text-gray-900">{scheduledJobs.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed Scans</p>
                    <p className="text-2xl font-semibold text-gray-900">{completedScans}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Cases</p>
                    <p className="text-2xl font-semibold text-gray-900">{jobs.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduled Scans Needing Upload */}
            {scheduledJobs.length > 0 && (
              <div className="mb-8 bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50 flex justify-between items-center">
                  <h2 className="text-base font-medium text-yellow-900">Scans Awaiting DICOM Upload ({scheduledJobs.length})</h2>
                  <span className="text-xs text-yellow-700">Action required</span>
                </div>
                <div className="divide-y divide-gray-200">
                  {scheduledJobs.map((job) => (
                    <div key={job._id} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Job #{job._id.slice(-8)}</p>
                        <p className="text-xs text-gray-500">
                          Scheduled: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                          {job.priority && ` · Priority: ${job.priority}`}
                        </p>
                      </div>
                      <Link href={`/images/upload?jobId=${job._id}`} legacyBehavior>
                        <a className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                          Upload DICOM
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Recent Jobs */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Recent Cases</h2>
                <Link href="/images/upload" legacyBehavior>
                  <a className="text-sm text-purple-600 hover:text-purple-500">Upload DICOM →</a>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Study Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.slice(0, 10).map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{job._id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.studyType || 'MRI Brain'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'DICOM Uploaded' ? 'bg-blue-100 text-blue-800' :
                            job.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {job.status === 'Scheduled' && (
                            <Link href={`/images/upload?jobId=${job._id}`} legacyBehavior>
                              <a className="text-xs text-purple-600 hover:text-purple-900">Upload</a>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">No cases yet.</td>
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
};

export default RadiographerDashboard;

// pages/dashboard/doctor.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentJobs from '../../components/dashboard/RecentJobs';
import Chart from '../../components/dashboard/Chart';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myReferrals: 8,
    pendingReviews: 3,
    completedReports: 45,
    urgentCases: 1
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Mock data for recent jobs
    const mockJobs = [
      { id: 'JOB-2023-001', patient: 'John Smith', status: 'Under Review', date: '2023-11-15' },
      { id: 'JOB-2023-002', patient: 'Emily Johnson', status: 'Completed', date: '2023-11-14' },
      { id: 'JOB-2023-003', patient: 'Michael Brown', status: 'Pending Review', date: '2023-11-14' },
      { id: 'JOB-2023-004', patient: 'Sarah Davis', status: 'Scheduled', date: '2023-11-13' },
      { id: 'JOB-2023-005', patient: 'Robert Wilson', status: 'Enhanced', date: '2023-11-13' },
    ];
    setRecentJobs(mockJobs);

    // Mock data for chart
    const mockChartData = [
      { name: 'Mon', jobs: 2 },
      { name: 'Tue', jobs: 3 },
      { name: 'Wed', jobs: 4 },
      { name: 'Thu', jobs: 1 },
      { name: 'Fri', jobs: 5 },
      { name: 'Sat', jobs: 1 },
      { name: 'Sun', jobs: 0 },
    ];
    setChartData(mockChartData);
  }, []);

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Doctor Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, Dr. {user?.firstName} {user?.lastName}. Here's your patient referral overview.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="My Referrals"
                value={stats.myReferrals}
                icon="document-text"
                color="purple"
              />
              <StatsCard
                title="Pending Reviews"
                value={stats.pendingReviews}
                icon="clock"
                color="yellow"
              />
              <StatsCard
                title="Completed Reports"
                value={stats.completedReports}
                icon="check-circle"
                color="green"
              />
              <StatsCard
                title="Urgent Cases"
                value={stats.urgentCases}
                icon="exclamation"
                color="red"
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentJobs jobs={recentJobs} />
              <Chart title="Weekly Referral Volume" data={chartData} />
            </div>

            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Latest updates on your patient referrals and reports.
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    <li className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-500">
                              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Report completed for John Smith</p>
                            <p className="text-sm text-gray-500">MRI analysis completed successfully</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">2 hours ago</div>
                      </div>
                    </li>
                    <li className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-yellow-500">
                              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">New referral from Dr. Johnson</p>
                            <p className="text-sm text-gray-500">Patient: Emily Johnson - Memory loss evaluation</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">4 hours ago</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DoctorDashboard;

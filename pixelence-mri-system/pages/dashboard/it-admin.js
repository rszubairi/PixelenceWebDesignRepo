// pages/dashboard/it-admin.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentJobs from '../../components/dashboard/RecentJobs';
import Chart from '../../components/dashboard/Chart';

const ITAdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 24,
    activeJobs: 12,
    completedJobs: 156,
    systemHealth: 'Good'
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Mock data for recent jobs
    const mockJobs = [
      { id: 'JOB-2023-001', patient: 'John Smith', status: 'Processing', date: '2023-11-15' },
      { id: 'JOB-2023-002', patient: 'Emily Johnson', status: 'Completed', date: '2023-11-14' },
      { id: 'JOB-2023-003', patient: 'Michael Brown', status: 'Under Review', date: '2023-11-14' },
      { id: 'JOB-2023-004', patient: 'Sarah Davis', status: 'Scheduled', date: '2023-11-13' },
      { id: 'JOB-2023-005', patient: 'Robert Wilson', status: 'Enhanced', date: '2023-11-13' },
    ];
    setRecentJobs(mockJobs);

    // Mock data for chart
    const mockChartData = [
      { name: 'Mon', jobs: 4 },
      { name: 'Tue', jobs: 6 },
      { name: 'Wed', jobs: 8 },
      { name: 'Thu', jobs: 5 },
      { name: 'Fri', jobs: 9 },
      { name: 'Sat', jobs: 3 },
      { name: 'Sun', jobs: 2 },
    ];
    setChartData(mockChartData);
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">IT Administrator Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user.name}. Here's what's happening with your system today.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Users"
                value={stats.totalUsers}
                icon="users"
                color="purple"
              />
              <StatsCard
                title="Active Jobs"
                value={stats.activeJobs}
                icon="document-text"
                color="blue"
              />
              <StatsCard
                title="Completed Jobs"
                value={stats.completedJobs}
                icon="check-circle"
                color="green"
              />
              <StatsCard
                title="System Health"
                value={stats.systemHealth}
                icon="health"
                color="yellow"
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentJobs jobs={recentJobs} />
              <Chart title="Weekly Job Volume" data={chartData} />
            </div>

            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">System Status</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Overview of system components and their current status.
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">AI Processing Engine</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Operational
                        </span>
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Database</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Operational
                        </span>
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">File Storage</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Operational
                        </span>
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Notification Service</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Maintenance
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ITAdminDashboard;
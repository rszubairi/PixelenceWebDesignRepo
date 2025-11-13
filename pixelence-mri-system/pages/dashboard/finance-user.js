// pages/dashboard/finance-user.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentJobs from '../../components/dashboard/RecentJobs';
import Chart from '../../components/dashboard/Chart';

const FinanceUserDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    pendingInvoices: 12,
    totalRevenue: 45000,
    unpaidBills: 5,
    monthlyGrowth: 8.5
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Mock data for recent jobs
    const mockJobs = [
      { id: 'JOB-2023-001', patient: 'John Smith', status: 'Payment Pending', date: '2023-11-15' },
      { id: 'JOB-2023-002', patient: 'Emily Johnson', status: 'Paid', date: '2023-11-14' },
      { id: 'JOB-2023-003', patient: 'Michael Brown', status: 'Invoiced', date: '2023-11-14' },
      { id: 'JOB-2023-004', patient: 'Sarah Davis', status: 'Scheduled', date: '2023-11-13' },
      { id: 'JOB-2023-005', patient: 'Robert Wilson', status: 'Completed', date: '2023-11-13' },
    ];
    setRecentJobs(mockJobs);

    // Mock data for chart
    const mockChartData = [
      { name: 'Jan', jobs: 12000 },
      { name: 'Feb', jobs: 15000 },
      { name: 'Mar', jobs: 18000 },
      { name: 'Apr', jobs: 22000 },
      { name: 'May', jobs: 25000 },
      { name: 'Jun', jobs: 28000 },
      { name: 'Jul', jobs: 32000 },
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
          <h1 className="text-2xl font-semibold text-gray-900">Finance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user.name}. Here's your financial overview.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Pending Invoices"
                value={stats.pendingInvoices}
                icon="document-text"
                color="yellow"
              />
              <StatsCard
                title="Total Revenue"
                value={`$${stats.totalRevenue.toLocaleString()}`}
                icon="currency-dollar"
                color="green"
              />
              <StatsCard
                title="Unpaid Bills"
                value={stats.unpaidBills}
                icon="exclamation"
                color="red"
              />
              <StatsCard
                title="Monthly Growth"
                value={`${stats.monthlyGrowth}%`}
                icon="trending-up"
                color="blue"
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentJobs jobs={recentJobs} />
              <Chart title="Monthly Revenue" data={chartData} />
            </div>

            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Latest billing and payment activities.
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
                            <p className="text-sm font-medium text-gray-900">Payment received from John Smith</p>
                            <p className="text-sm text-gray-500">$2,500 for MRI analysis</p>
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
                            <p className="text-sm font-medium text-gray-900">Invoice sent to Emily Johnson</p>
                            <p className="text-sm text-gray-500">$1,800 pending payment</p>
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
  );
};

export default FinanceUserDashboard;

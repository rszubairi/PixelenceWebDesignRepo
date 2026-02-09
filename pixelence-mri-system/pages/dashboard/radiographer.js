// pages/dashboard/radiographer.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentJobs from '../../components/dashboard/RecentJobs';
import Chart from '../../components/dashboard/Chart';

const RadiographerDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    scansToday: 8,
    pendingUploads: 3,
    completedScans: 156,
    equipmentStatus: 'All Operational'
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Mock data for recent jobs
    const mockJobs = [
      { id: 'JOB-2023-001', patient: 'John Smith', status: 'DICOM Uploaded', date: '2023-11-15' },
      { id: 'JOB-2023-002', patient: 'Emily Johnson', status: 'Processing', date: '2023-11-14' },
      { id: 'JOB-2023-003', patient: 'Michael Brown', status: 'Scan Complete', date: '2023-11-14' },
      { id: 'JOB-2023-004', patient: 'Sarah Davis', status: 'Scheduled', date: '2023-11-13' },
      { id: 'JOB-2023-005', patient: 'Robert Wilson', status: 'Enhanced', date: '2023-11-13' },
    ];
    setRecentJobs(mockJobs);

    // Mock data for chart
    const mockChartData = [
      { name: 'Mon', jobs: 12 },
      { name: 'Tue', jobs: 15 },
      { name: 'Wed', jobs: 18 },
      { name: 'Thu', jobs: 14 },
      { name: 'Fri', jobs: 20 },
      { name: 'Sat', jobs: 8 },
      { name: 'Sun', jobs: 5 },
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
          <h1 className="text-2xl font-semibold text-gray-900">Radiographer Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user?.firstName} {user?.lastName}. Here's your imaging workflow overview.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Scans Today"
                value={stats.scansToday}
                icon="camera"
                color="purple"
              />
              <StatsCard
                title="Pending Uploads"
                value={stats.pendingUploads}
                icon="cloud-upload"
                color="yellow"
              />
              <StatsCard
                title="Completed Scans"
                value={stats.completedScans}
                icon="check-circle"
                color="green"
              />
              <StatsCard
                title="Equipment Status"
                value={stats.equipmentStatus}
                icon="cog"
                color="blue"
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentJobs jobs={recentJobs} />
              <Chart title="Weekly Scan Volume" data={chartData} />
            </div>

            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Equipment Status</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Current status of imaging equipment and systems.
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">MRI Scanner 1</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Operational
                        </span>
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">MRI Scanner 2</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Operational
                        </span>
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">DICOM Workstation</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Operational
                        </span>
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">PACS System</dt>
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

export default RadiographerDashboard;

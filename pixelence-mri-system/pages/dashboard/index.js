// pages/dashboard/index.js
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the dashboard component with SSR disabled
const DashboardComponent = dynamic(() => import('../../components/DashboardRedirect'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  ),
});

const Dashboard = () => {
  return <DashboardComponent />;
};

export default Dashboard;

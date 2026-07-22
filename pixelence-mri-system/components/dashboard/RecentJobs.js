// components/dashboard/RecentJobs.js
import React from 'react';

const statusClasses = {
  Scheduled: 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Pending Review': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
  Enhanced: 'bg-indigo-100 text-indigo-800',
};

const RecentJobs = ({ jobs = [] }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Jobs</h3>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {jobs.length === 0 ? (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">No recent jobs</li>
          ) : (
            jobs.map((job) => (
              <li key={job.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.patient}</p>
                    <p className="text-sm text-gray-500">{job.id} · {job.date}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      statusClasses[job.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default RecentJobs;

// components/dashboard/RecentJobs.js
import React from 'react';
import Link from 'next/link';

const RecentJobs = ({ jobs }) => {
  const getStatusClass = (status) => {
    const statusClasses = {
      'Scheduled': 'status-scheduled',
      'DICOM Uploaded': 'status-uploaded',
      'Processing': 'status-processing',
      'Enhanced': 'status-enhanced',
      'Analysis Complete': 'status-analysis-complete',
      'Under Review': 'status-under-review',
      'Approved': 'status-approved',
      'Completed': 'status-completed',
    };

    return statusClasses[status] || 'status-scheduled';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Jobs</h3>
        <div className="mt-5">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {jobs.map((job) => (
                <li key={job.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {job.patient.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {job.patient}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {job.id} • {job.date}
                      </p>
                    </div>
                    <div>
                      <span className={`status-badge ${getStatusClass(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <div>
                      <Link href={`/appointments/${job.id}`} legacyBehavior>
                        <a className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                          View
                        </a>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6">
          <Link href="/appointments" legacyBehavior>
            <a className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              View all
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecentJobs;

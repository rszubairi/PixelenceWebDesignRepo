// pages/reports/index.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/router';

const Reports = () => {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Mock data for reports
    const mockReports = [
      {
        id: 'RPT-2023-001',
        jobId: 'JOB-2023-001',
        patientName: 'John Smith',
        age: 45,
        gender: 'Male',
        status: 'Analysis Complete',
        generatedDate: '2023-11-20T10:30:00',
        approved: false,
        priority: 'Normal',
      },
      {
        id: 'RPT-2023-002',
        jobId: 'JOB-2023-002',
        patientName: 'Emily Johnson',
        age: 32,
        gender: 'Female',
        status: 'Under Review',
        generatedDate: '2023-11-21T14:45:00',
        approved: false,
        priority: 'High',
      },
      {
        id: 'RPT-2023-003',
        jobId: 'JOB-2023-003',
        patientName: 'Michael Brown',
        age: 58,
        gender: 'Male',
        status: 'Approved',
        generatedDate: '2023-11-19T16:20:00',
        approved: true,
        priority: 'Normal',
      },
      {
        id: 'RPT-2023-004',
        jobId: 'JOB-2023-004',
        patientName: 'Sarah Davis',
        age: 27,
        gender: 'Female',
        status: 'Analysis Complete',
        generatedDate: '2023-11-22T11:15:00',
        approved: false,
        priority: 'Low',
      },
      {
        id: 'RPT-2023-005',
        jobId: 'JOB-2023-005',
        patientName: 'Robert Wilson',
        age: 63,
        gender: 'Male',
        status: 'Approved',
        generatedDate: '2023-11-18T13:40:00',
        approved: true,
        priority: 'High',
      },
    ];
    setReports(mockReports);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.jobId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  const columns = [
    { key: 'id', label: 'Report ID' },
    { key: 'jobId', label: 'Job ID' },
    { key: 'patientName', label: 'Patient Name' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'status', label: 'Status', format: (status) => (
      <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
        {status}
      </span>
    )},
    { key: 'generatedDate', label: 'Generated Date', format: (date) => new Date(date).toLocaleDateString() },
    { key: 'approved', label: 'Approved', format: (approved) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {approved ? 'Yes' : 'No'}
      </span>
    )},
    { key: 'actions', label: 'Actions', format: (_, row) => (
      <div className="flex space-x-2">
        <Button size="sm" onClick={() => router.push(`/reports/${row.id}`)}>
          View
        </Button>
        {row.status === 'Analysis Complete' && (
          <Button size="sm" variant="secondary" onClick={() => router.push(`/images/${row.jobId}`)}>
            View Images
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Medical Reports</h1>
            <Button onClick={() => router.push('/appointments')}>
              View Appointments
            </Button>
          </div>
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="max-w-xs w-full">
                      <label htmlFor="search" className="sr-only">Search</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          id="search"
                          name="search"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="Search reports"
                          type="search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-4">
                  <label htmlFor="filter" className="sr-only">Filter</label>
                  <select
                    id="filter"
                    name="filter"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Analysis Complete">Analysis Complete</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>
            <Table columns={columns} data={filteredReports} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;

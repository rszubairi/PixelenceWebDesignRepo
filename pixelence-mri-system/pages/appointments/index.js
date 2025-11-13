// pages/appointments/index.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Form from '../../components/ui/Form';

const Appointments = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Mock data for appointments
    const mockAppointments = [
      {
        id: 'JOB-2023-001',
        patientName: 'John Smith',
        age: 45,
        gender: 'Male',
        complaint: 'Persistent headaches',
        causeOfReferral: 'Neurological symptoms',
        referringPhysician: 'Dr. Johnson',
        institution: 'General Hospital',
        scheduledDateTime: '2023-11-20T09:00:00',
        status: 'Scheduled',
      },
      {
        id: 'JOB-2023-002',
        patientName: 'Emily Johnson',
        age: 32,
        gender: 'Female',
        complaint: 'Memory loss',
        causeOfReferral: 'Cognitive assessment',
        referringPhysician: 'Dr. Williams',
        institution: 'General Hospital',
        scheduledDateTime: '2023-11-21T14:30:00',
        status: 'DICOM Uploaded',
      },
      {
        id: 'JOB-2023-003',
        patientName: 'Michael Brown',
        age: 58,
        gender: 'Male',
        complaint: 'Seizures',
        causeOfReferral: 'Epilepsy evaluation',
        referringPhysician: 'Dr. Davis',
        institution: 'General Hospital',
        scheduledDateTime: '2023-11-19T11:15:00',
        status: 'Under Review',
      },
      {
        id: 'JOB-2023-004',
        patientName: 'Sarah Davis',
        age: 27,
        gender: 'Female',
        complaint: 'Dizziness',
        causeOfReferral: 'Balance issues',
        referringPhysician: 'Dr. Miller',
        institution: 'General Hospital',
        scheduledDateTime: '2023-11-22T10:00:00',
        status: 'Scheduled',
      },
      {
        id: 'JOB-2023-005',
        patientName: 'Robert Wilson',
        age: 63,
        gender: 'Male',
        complaint: 'Vision changes',
        causeOfReferral: 'Optic nerve assessment',
        referringPhysician: 'Dr. Taylor',
        institution: 'General Hospital',
        scheduledDateTime: '2023-11-18T15:45:00',
        status: 'Completed',
      },
    ];
    setAppointments(mockAppointments);
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === 'all' || appointment.status === filter;
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreateAppointment = (formData) => {
    // In a real app, this would make an API call
    const newAppointment = {
      id: `JOB-2023-${String(appointments.length + 1).padStart(3, '0')}`,
      ...formData,
      status: 'Scheduled',
    };
    setAppointments([...appointments, newAppointment]);
    setShowCreateModal(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const columns = [
    { key: 'id', label: 'Job ID' },
    { key: 'patientName', label: 'Patient Name' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'complaint', label: 'Complaint' },
    { key: 'referringPhysician', label: 'Referring Physician' },
    { key: 'scheduledDateTime', label: 'Scheduled Date & Time', format: (date) => new Date(date).toLocaleString() },
    { key: 'status', label: 'Status', format: (status) => (
      <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
        {status}
      </span>
    )},
    { key: 'actions', label: 'Actions', format: (_, row) => (
      <div className="flex space-x-2">
        <Button size="sm" variant="secondary" onClick={() => window.location.href = `/appointments/${row.id}`}>
          View
        </Button>
        {row.status === 'Scheduled' && (
          <Button size="sm" variant="secondary" onClick={() => window.location.href = `/images/upload?jobId=${row.id}`}>
            Upload DICOM
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
            <h1 className="text-2xl font-semibold text-gray-900">Patient Appointments</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              Create New Appointment
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
                          placeholder="Search appointments"
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
                    <option value="Scheduled">Scheduled</option>
                    <option value="DICOM Uploaded">DICOM Uploaded</option>
                    <option value="Processing">Processing</option>
                    <option value="Enhanced">Enhanced</option>
                    <option value="Analysis Complete">Analysis Complete</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <Table columns={columns} data={filteredAppointments} />
          </div>
        </div>
      </div>

      {showCreateModal && (
        <Modal title="Create New Appointment" onClose={() => setShowCreateModal(false)}>
          <Form
            fields={[
              { name: 'patientName', label: 'Patient Full Name', type: 'text', required: true },
              { name: 'age', label: 'Age', type: 'number', required: true },
              { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
              { name: 'complaint', label: 'Complaint Description', type: 'textarea', required: true },
              { name: 'causeOfReferral', label: 'Cause of Referral', type: 'text', required: true },
              { name: 'referringPhysician', label: 'Referring Physician Name', type: 'text', required: true },
              { name: 'institution', label: 'Institution/Hospital Name', type: 'text', required: true },
              { name: 'scheduledDateTime', label: 'Scheduled Date and Time', type: 'datetime-local', required: true },
            ]}
            onSubmit={handleCreateAppointment}
            submitText="Create Appointment"
          />
        </Modal>
      )}
    </Layout>
  );
};

export default Appointments;
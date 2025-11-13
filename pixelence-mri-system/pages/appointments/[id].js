// pages/appointments/[id].js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/router';

const AppointmentDetails = () => {
  const [user, setUser] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Fetch appointment data
    if (id) {
      fetchAppointmentData(id);
    }
  }, [id]);

  const fetchAppointmentData = async (appointmentId) => {
    // Mock API call to get appointment data
    const mockAppointment = {
      id: appointmentId,
      patientName: 'John Smith',
      age: 45,
      gender: 'Male',
      complaint: 'Persistent headaches',
      referringPhysician: 'Dr. Johnson',
      institution: 'General Hospital',
      scheduledDateTime: '2023-11-20T09:00:00',
      status: 'Scheduled',
      priority: 'Normal',
      notes: 'Patient reports headaches for the past 2 weeks. Previous CT scan showed no abnormalities.',
      contactInfo: {
        phone: '+1 (555) 123-4567',
        email: 'john.smith@email.com',
        emergencyContact: 'Jane Smith - Sister - +1 (555) 987-6543'
      },
      medicalHistory: [
        'Hypertension (controlled)',
        'Previous migraine episodes',
        'Allergic to penicillin'
      ]
    };
    setAppointment(mockAppointment);
    setLoading(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Appointment Details</h1>
              <p className="mt-1 text-sm text-gray-600">
                Appointment ID: {appointment.id}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => router.back()}>
                Back to Appointments
              </Button>
              <Button onClick={() => router.push(`/images/${appointment.id}`)}>
                View Images
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Appointment Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h2>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{appointment.patientName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Age</dt>
                    <dd className="text-sm text-gray-900">{appointment.age} years</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="text-sm text-gray-900">{appointment.gender}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Priority</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.priority === 'High' ? 'bg-red-100 text-red-800' :
                        appointment.priority === 'Normal' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {appointment.priority}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Complaint</dt>
                    <dd className="text-sm text-gray-900">{appointment.complaint}</dd>
                  </div>
                </dl>
              </div>

              {/* Appointment Details */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h2>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Scheduled Date</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(appointment.scheduledDateTime).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Scheduled Time</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(appointment.scheduledDateTime).toLocaleTimeString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Referring Physician</dt>
                    <dd className="text-sm text-gray-900">{appointment.referringPhysician}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Institution</dt>
                    <dd className="text-sm text-gray-900">{appointment.institution}</dd>
                  </div>
                </dl>
              </div>

              {/* Clinical Notes */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Clinical Notes</h2>
                <p className="text-sm text-gray-700">{appointment.notes}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-xs text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{appointment.contactInfo.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{appointment.contactInfo.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Emergency Contact</dt>
                    <dd className="text-sm text-gray-900">{appointment.contactInfo.emergencyContact}</dd>
                  </div>
                </dl>
              </div>

              {/* Medical History */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Medical History</h3>
                <ul className="space-y-1">
                  {appointment.medicalHistory.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    Start Examination
                  </Button>
                  <Button variant="secondary" className="w-full" size="sm">
                    Reschedule
                  </Button>
                  <Button variant="danger" className="w-full" size="sm">
                    Cancel Appointment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AppointmentDetails;

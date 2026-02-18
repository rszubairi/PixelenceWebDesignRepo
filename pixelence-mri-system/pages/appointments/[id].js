// pages/appointments/[id].js
import React from 'react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const AppointmentDetails = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const appointment = useQuery(
    api.appointments.getAppointmentById,
    id ? { appointmentId: id } : "skip"
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  if (appointment === undefined) {
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

  if (appointment === null) {
    return (
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-gray-900">Appointment not found</h2>
              <p className="mt-2 text-sm text-gray-600">The appointment with ID &quot;{id}&quot; could not be found.</p>
              <div className="mt-4">
                <Button onClick={() => router.push('/appointments')}>
                  Back to Appointments
                </Button>
              </div>
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
                Appointment ID: {appointment.appointmentId}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => router.back()}>
                Back to Appointments
              </Button>
              <Button onClick={() => router.push(`/images/${appointment.appointmentId}`)}>
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
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Cause of Referral</dt>
                    <dd className="text-sm text-gray-900">{appointment.causeOfReferral}</dd>
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
                        appointment.status === 'DICOM Uploaded' ? 'bg-indigo-100 text-indigo-800' :
                        appointment.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="text-sm text-gray-900">{appointment.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Referring Physician</dt>
                    <dd className="text-sm text-gray-900">{appointment.referringPhysician}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Institution</dt>
                    <dd className="text-sm text-gray-900">{appointment.institution}</dd>
                  </div>
                </dl>
              </div>

              {/* Clinical Notes */}
              {appointment.notes && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Clinical Notes</h2>
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-xs text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{appointment.contactInfo.phone || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{appointment.contactInfo.email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Emergency Contact</dt>
                    <dd className="text-sm text-gray-900">{appointment.contactInfo.emergencyContact || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              {/* Medical History */}
              {appointment.medicalHistory.length > 0 && (
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
              )}

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

export async function getServerSideProps() {
  return { props: {} };
}

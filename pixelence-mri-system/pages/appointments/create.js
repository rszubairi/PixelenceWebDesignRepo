// pages/appointments/create.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Form from '../../components/ui/Form';
import Button from '../../components/ui/Button';

const CreateAppointment = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);
  }, []);

  const handleCreateAppointment = (formData) => {
    // In a real app, this would make an API call
    console.log('Creating appointment:', formData);
    // Redirect back to appointments list
    router.push('/appointments');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Create New Appointment</h1>
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
          <div className="mt-6 bg-white shadow rounded-lg p-6">
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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateAppointment;

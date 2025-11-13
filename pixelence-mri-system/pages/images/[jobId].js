// pages/images/[jobId].js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import DicomViewer from '../../components/imaging/DicomViewer';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/router';

const ImageViewer = () => {
  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { jobId } = router.query;

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Fetch job data
    if (jobId) {
      fetchJobData(jobId);
    }
  }, [jobId]);

  const fetchJobData = async (id) => {
    // Mock API call to get job data
    const mockJob = {
      id: id,
      patientName: 'John Smith',
      age: 45,
      gender: 'Male',
      complaint: 'Persistent headaches',
      scheduledDateTime: '2023-11-20T09:00:00',
      status: 'DICOM Uploaded',
      images: [
        { id: 'img1', url: '/images/sample-dicom-1.jpg', type: 'T1' },
        { id: 'img2', url: '/images/sample-dicom-2.jpg', type: 'T2' },
        { id: 'img3', url: '/images/sample-dicom-3.jpg', type: 'FLAIR' },
        { id: 'img4', url: '/images/sample-dicom-4.jpg', type: 'T1C' },
      ],
    };
    setJob(mockJob);
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
              <h1 className="text-2xl font-semibold text-gray-900">DICOM Image Viewer</h1>
              <p className="mt-1 text-sm text-gray-600">
                Job ID: {job.id} | Patient: {job.patientName}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => router.back()}>
                Back to Jobs
              </Button>
              <Button onClick={() => router.push(`/reports/${job.id}`)}>
                View Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* DICOM Viewer */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Medical Images</h2>
              <DicomViewer images={job.images} />
            </div>

            {/* Patient Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{job.patientName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="text-sm text-gray-900">{job.age} years</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="text-sm text-gray-900">{job.gender}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Complaint</dt>
                  <dd className="text-sm text-gray-900">{job.complaint}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled Date</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(job.scheduledDateTime).toLocaleDateString()} at{' '}
                    {new Date(job.scheduledDateTime).toLocaleTimeString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    <span className={`status-badge ${job.status.toLowerCase().replace(' ', '-')}`}>
                      {job.status}
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Image Series</h3>
                <div className="space-y-2">
                  {job.images.map((image, index) => (
                    <div key={image.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Image {index + 1}</span>
                      <span className="font-medium text-gray-900">{image.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ImageViewer;

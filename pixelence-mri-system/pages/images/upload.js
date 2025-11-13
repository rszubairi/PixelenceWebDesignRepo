// pages/images/upload.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useRouter } from 'next/router';

const ImageUpload = () => {
  const [user, setUser] = useState(null);
  const [jobId, setJobId] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Get jobId from query params
    if (router.query.jobId) {
      setJobId(router.query.jobId);
      fetchJobDetails(router.query.jobId);
    }
  }, [router.query]);

  const fetchJobDetails = async (id) => {
    // Mock API call to get job details
    const mockJobDetails = {
      id: id,
      patientName: 'John Smith',
      age: 45,
      gender: 'Male',
      complaint: 'Persistent headaches',
      causeOfReferral: 'Neurological symptoms',
      referringPhysician: 'Dr. Johnson',
      institution: 'General Hospital',
      scheduledDateTime: '2023-11-20T09:00:00',
      status: 'Scheduled',
    };
    setJobDetails(mockJobDetails);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select at least one DICOM file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate file upload with progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 5000));

    setUploading(false);
    setUploadComplete(true);
  };

  const handleReset = () => {
    setFiles([]);
    setUploadProgress(0);
    setUploadComplete(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">DICOM Image Upload</h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload DICOM images for patient appointments.
          </p>

          {jobDetails && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Job ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{jobDetails.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Patient Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{jobDetails.patientName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="mt-1 text-sm text-gray-900">{jobDetails.age}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900">{jobDetails.gender}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Complaint</dt>
                  <dd className="mt-1 text-sm text-gray-900">{jobDetails.complaint}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Cause of Referral</dt>
                  <dd className="mt-1 text-sm text-gray-900">{jobDetails.causeOfReferral}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Referring Physician</dt>
                  <dd className="mt-1 text-sm text-gray-900">{jobDetails.referringPhysician}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Institution</dt>
                  <dd className="mt-1 text-sm text-gray-900">{jobDetails.institution}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Scheduled Date & Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(jobDetails.scheduledDateTime).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload DICOM Files</h2>

            {!jobId && (
              <div className="mb-4">
                <label htmlFor="jobId" className="form-label">Job ID</label>
                <input
                  id="jobId"
                  name="jobId"
                  type="text"
                  className="form-input"
                  placeholder="Enter Job ID"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                />
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="dicomFiles" className="form-label">Select DICOM Files</label>
              <input
                id="dicomFiles"
                name="dicomFiles"
                type="file"
                multiple
                accept=".dcm,.dicom"
                className="form-input"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <p className="mt-1 text-sm text-gray-500">
                You can select multiple DICOM files at once.
              </p>
            </div>

            {files.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Selected Files:</h3>
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  {files.map((file, index) => (
                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                        <span className="ml-4 flex-shrink-0 text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Upload Progress</span>
                  <span className="text-sm font-medium text-purple-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {uploadComplete && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      DICOM files uploaded successfully! The images are now being processed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              {uploadComplete ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => router.push(`/appointments/${jobId}`)}
                >
                  View Job Status
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleReset}
                    disabled={uploading}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0 || !jobId}
                  >
                    {uploading ? 'Uploading...' : 'Upload Files'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ImageUpload;
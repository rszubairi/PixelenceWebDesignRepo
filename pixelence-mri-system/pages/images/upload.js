// pages/images/upload.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const ImageUpload = () => {
  const { user } = useAuth();
  const [jobId, setJobId] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const job = useQuery(api.jobs.getJobById, jobId ? { jobId } : "skip");
  const appointment = useQuery(
    api.appointments.getAppointmentById,
    job?.appointmentId ? { id: job.appointmentId } : "skip"
  );

  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const completeUpload = useMutation(api.jobs.completeUpload);

  useEffect(() => {
    if (router.query.jobId) {
      setJobId(router.query.jobId);
    }
  }, [router.query]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select at least one DICOM file to upload.');
      return;
    }
    if (!jobId) {
      alert('Please enter a Job ID.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const storageIds = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type || 'application/dicom' },
          body: file,
        });
        if (!result.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        const { storageId } = await result.json();
        storageIds.push(storageId);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      await completeUpload({
        jobId,
        storageIds,
        studyType: 'Brain MRI',
      });

      setUploading(false);
      setUploadComplete(true);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setUploadProgress(0);
    setUploadComplete(false);
    setError('');
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

          {job && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Job ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job._id}</dd>
                </div>
                {appointment && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Patient Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{appointment.patientName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Age</dt>
                      <dd className="mt-1 text-sm text-gray-900">{appointment.age}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="mt-1 text-sm text-gray-900">{appointment.gender}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Complaint</dt>
                      <dd className="mt-1 text-sm text-gray-900">{appointment.complaint}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Cause of Referral</dt>
                      <dd className="mt-1 text-sm text-gray-900">{appointment.causeOfReferral}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Referring Physician</dt>
                      <dd className="mt-1 text-sm text-gray-900">{appointment.referringPhysician}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Scheduled Date & Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {appointment.scheduledDateTime && new Date(appointment.scheduledDateTime).toLocaleString()}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          )}

          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload DICOM Files</h2>

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
                disabled={uploading || uploadComplete}
              />
            </div>

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

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{error}</p>
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
                      DICOM files uploaded successfully! The images are now available for review.
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
                  onClick={() => router.push(`/images/${jobId}`)}
                >
                  View Images
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

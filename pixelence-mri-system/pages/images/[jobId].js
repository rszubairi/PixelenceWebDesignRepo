// pages/images/[jobId].js
import React from 'react';
import Layout from '../../components/layout/Layout';
import DicomViewer from '../../components/imaging/DicomViewer';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const ImageViewer = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { jobId } = router.query;

  const report = useQuery(
    api.reports.getReportByJobId,
    jobId ? { jobId } : "skip"
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  if (report === undefined) {
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

  if (report === null) {
    return (
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-gray-900">Report not found</h2>
              <p className="mt-2 text-sm text-gray-600">No report found for Job ID &quot;{jobId}&quot;.</p>
              <div className="mt-4">
                <Button onClick={() => router.push('/reports')}>
                  Back to Reports
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
              <h1 className="text-2xl font-semibold text-gray-900">DICOM Image Viewer</h1>
              <p className="mt-1 text-sm text-gray-600">
                Job ID: {report.jobId} | Patient: {report.patientName}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={() => router.push(`/reports/${report.reportId}`)}>
                View Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* DICOM Viewer */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Medical Images</h2>
              <DicomViewer images={report.images} dicomFile={report.dicomFile} />
            </div>

            {/* Patient Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{report.patientName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="text-sm text-gray-900">{report.age} years</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="text-sm text-gray-900">{report.gender}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Complaint</dt>
                  <dd className="text-sm text-gray-900">{report.complaint}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Exam Date</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(report.scheduledDateTime).toLocaleDateString()} at{' '}
                    {new Date(report.scheduledDateTime).toLocaleTimeString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      report.status === 'Analysis Complete' ? 'bg-green-100 text-green-800' :
                      report.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">DICOM File</dt>
                  <dd className="text-sm text-gray-900">{report.dicomFile}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Image Series</h3>
                <div className="space-y-2">
                  {report.images.map((image, index) => (
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

export async function getServerSideProps() {
  return { props: {} };
}

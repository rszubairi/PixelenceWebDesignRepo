// pages/reports/[id].js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/router';

const ReportDetails = () => {
  const [user, setUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Fetch report data
    if (id) {
      fetchReportData(id);
    }
  }, [id]);

  const fetchReportData = async (reportId) => {
    // Mock API call to get report data
    const mockReport = {
      id: reportId,
      jobId: 'JOB-2023-001',
      patientName: 'John Smith',
      age: 45,
      gender: 'Male',
      complaint: 'Persistent headaches',
      referringPhysician: 'Dr. Johnson',
      institution: 'General Hospital',
      scheduledDateTime: '2023-11-20T09:00:00',
      status: 'Analysis Complete',
      images: [
        { id: 'img1', url: '/images/sample-dicom-1.jpg', type: 'T1' },
        { id: 'img2', url: '/images/sample-dicom-2.jpg', type: 'T2' },
        { id: 'img3', url: '/images/sample-dicom-3.jpg', type: 'FLAIR' },
      ],
      aiAnalysis: {
        sitesOfUptake: 'Left frontal lobe, right temporal lobe',
        natureOfUptake: 'Irregular enhancement with surrounding edema',
        conclusion: 'Findings suggest presence of primary brain tumor with possible metastasis',
        diagnosisRecommendations: 'Recommend biopsy for histopathological confirmation',
      },
      radiologistComments: '',
      approved: false,
      generatedDate: '2023-11-20T10:30:00',
    };
    setReport(mockReport);
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
              <h1 className="text-2xl font-semibold text-gray-900">Medical Report</h1>
              <p className="mt-1 text-sm text-gray-600">
                Job ID: {report.jobId} | Patient: {report.patientName}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => router.back()}>
                Back to Reports
              </Button>
              <Button onClick={() => router.push(`/images/${report.id}`)}>
                View Images
              </Button>
              <Button onClick={() => window.print()}>
                Print Report
              </Button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Report Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">MRI Analysis Report</h2>
                  <p className="text-sm text-gray-600">Generated on {new Date(report.generatedDate).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    report.status === 'Analysis Complete' ? 'bg-green-100 text-green-800' :
                    report.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Patient Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Name:</dt>
                      <dd className="text-sm text-gray-900">{report.patientName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Age:</dt>
                      <dd className="text-sm text-gray-900">{report.age} years</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Gender:</dt>
                      <dd className="text-sm text-gray-900">{report.gender}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Referring Physician:</dt>
                      <dd className="text-sm text-gray-900">{report.referringPhysician}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Institution:</dt>
                      <dd className="text-sm text-gray-900">{report.institution}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Exam Date:</dt>
                      <dd className="text-sm text-gray-900">{new Date(report.scheduledDateTime).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>

                {/* Clinical Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Clinical Indication:</dt>
                      <dd className="text-sm text-gray-900 mt-1">{report.complaint}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Study Type:</dt>
                      <dd className="text-sm text-gray-900 mt-1">MRI Brain with Contrast</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Images Acquired:</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {report.images.length} series ({report.images.map(img => img.type).join(', ')})
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* AI Analysis Results */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis Results</h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Sites of Uptake:</h4>
                    <p className="text-sm text-gray-700 mt-1">{report.aiAnalysis.sitesOfUptake}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Nature of Uptake:</h4>
                    <p className="text-sm text-gray-700 mt-1">{report.aiAnalysis.natureOfUptake}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Conclusion:</h4>
                    <p className="text-sm text-gray-700 mt-1">{report.aiAnalysis.conclusion}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Diagnosis Recommendations:</h4>
                    <p className="text-sm text-gray-700 mt-1">{report.aiAnalysis.diagnosisRecommendations}</p>
                  </div>
                </div>
              </div>

              {/* Radiologist Comments */}
              {report.radiologistComments && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Radiologist Comments</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{report.radiologistComments}</p>
                  </div>
                </div>
              )}

              {/* Report Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Report generated by Pixelence MRI Analysis System
                  </div>
                  <div className="text-sm text-gray-500">
                    Report ID: {report.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportDetails;

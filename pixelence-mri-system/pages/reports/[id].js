// pages/reports/[id].js
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { anyApi } from 'convex/server';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../convex/_generated/api';

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';

const ReportDetails = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  // --- Data fetching ---
  const report = useQuery(anyApi.reports.getReportById, id ? { reportId: id } : 'skip');
  const job = useQuery(
    anyApi.jobs.getJobById,
    report?.jobId ? { jobId: report.jobId } : 'skip'
  );
  const appointment = useQuery(
    anyApi.appointments.getAppointmentById,
    report?.appointmentId ? { id: report.appointmentId } : 'skip'
  );

  // --- Mutations ---
  const submitReportMutation = useMutation(anyApi.reports.submitReport);
  const addDoctorCommentMutation = useMutation(anyApi.reports.addDoctorComment);
  const saveEnhancedMriMutation = useMutation(anyApi.jobs.saveEnhancedMri);

  // --- Local state ---
  const [radiologistComments, setRadiologistComments] = useState('');
  const [doctorComments, setDoctorComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [generatingEnhanced, setGeneratingEnhanced] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');
  const [enhancedError, setEnhancedError] = useState('');

  // Sync doctor comments with existing data
  React.useEffect(() => {
    if (report?.doctorComments && !doctorComments) {
      setDoctorComments(report.doctorComments);
    }
    if (report?.radiologistComments && !radiologistComments) {
      setRadiologistComments(report.radiologistComments);
    }
  }, [report]);

  if (!user) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  // While querying — show spinner only if id is present but report not yet loaded
  if (id && report === undefined) {
    return (
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // If no report found after loading
  if (id && report === null) {
    return (
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-gray-500">Report not found.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Fall back to mock for demo when no real data
  const displayReport = report || {
    jobId: 'demo-job',
    appointmentId: 'demo-appt',
    status: 'Analysis Complete',
    radiologistApproved: false,
    radiologistComments: '',
    doctorComments: '',
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      sitesOfUptake: 'Left frontal lobe, right temporal lobe',
      natureOfUptake: 'Irregular enhancement with surrounding edema',
      conclusion: 'Findings suggest presence of primary brain tumor with possible metastasis',
      diagnosisRecommendations: 'Recommend biopsy for histopathological confirmation',
    },
  };

  const displayAppointment = appointment || {
    patientName: 'Demo Patient',
    age: 45,
    gender: 'Male',
    complaint: 'Persistent headaches',
    referringPhysician: 'Dr. Demo',
    scheduledDateTime: new Date().toISOString(),
  };

  const displayJob = job || { enhancedMriPath: null };

  const isRadiologist = user?.role === 'radiologist';
  const isDoctor = user?.role === 'doctor';
  const canSubmitReport = isRadiologist && displayReport.status !== 'Approved' && displayReport.status !== 'Submitted';
  const reportAlreadySubmitted = displayReport.status === 'Approved' || displayReport.status === 'Submitted';

  // --- Radiologist: Submit / Approve report ---
  const handleSubmitReport = async (approved) => {
    if (!report) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      await submitReportMutation({
        reportId: report._id,
        radiologistId: user._id,
        radiologistComments,
        approved,
      });
      setSubmitSuccess(approved ? 'Report approved and submitted.' : 'Report submitted for review.');
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Doctor: Save comments ---
  const handleSaveComment = async () => {
    if (!report) return;
    setSavingComment(true);
    try {
      await addDoctorCommentMutation({
        reportId: report._id,
        doctorId: user._id,
        doctorComments,
      });
      setCommentSuccess('Comments saved.');
      setTimeout(() => setCommentSuccess(''), 3000);
    } catch (err) {
      // show inline
    } finally {
      setSavingComment(false);
    }
  };

  // --- Radiologist: Generate Enhanced MRI ---
  const handleGenerateEnhanced = async () => {
    if (!job) return;
    setEnhancedError('');
    setGeneratingEnhanced(true);
    try {
      const response = await fetch(`${ML_SERVICE_URL}/api/v1/enhance-mri/${job._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`FastAPI returned ${response.status}`);
      }
      const data = await response.json();
      const imagePath = data.enhanced_mri_path || data.imagePath || data.path;
      if (!imagePath) throw new Error('No image path returned from ML service');

      await saveEnhancedMriMutation({ jobId: job._id, enhancedMriPath: imagePath });
    } catch (err) {
      setEnhancedError(err.message || 'Failed to generate enhanced MRI');
    } finally {
      setGeneratingEnhanced(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Medical Report</h1>
              <p className="mt-1 text-sm text-gray-600">
                Patient: {displayAppointment.patientName}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => router.back()}>
                Back to Reports
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
                  <p className="text-sm text-gray-600">Generated on {new Date(displayReport.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    displayReport.status === 'Analysis Complete' ? 'bg-green-100 text-green-800' :
                    displayReport.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                    displayReport.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                    displayReport.status === 'Submitted' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {displayReport.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              {/* Patient Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Name:</dt>
                      <dd className="text-sm text-gray-900">{displayAppointment.patientName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Age:</dt>
                      <dd className="text-sm text-gray-900">{displayAppointment.age} years</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Gender:</dt>
                      <dd className="text-sm text-gray-900">{displayAppointment.gender}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Referring Physician:</dt>
                      <dd className="text-sm text-gray-900">{displayAppointment.referringPhysician}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Exam Date:</dt>
                      <dd className="text-sm text-gray-900">
                        {displayAppointment.scheduledDateTime
                          ? new Date(displayAppointment.scheduledDateTime).toLocaleDateString()
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Clinical Indication:</dt>
                      <dd className="text-sm text-gray-900 mt-1">{displayAppointment.complaint}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Study Type:</dt>
                      <dd className="text-sm text-gray-900 mt-1">{displayJob.studyType || 'MRI Brain with Contrast'}</dd>
                    </div>
                    {displayJob.imageCount && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Images Acquired:</dt>
                        <dd className="text-sm text-gray-900 mt-1">{displayJob.imageCount} series</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* AI Analysis */}
              {displayReport.aiAnalysis && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis Results</h3>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Sites of Uptake:</h4>
                      <p className="text-sm text-gray-700 mt-1">{displayReport.aiAnalysis.sitesOfUptake}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Nature of Uptake:</h4>
                      <p className="text-sm text-gray-700 mt-1">{displayReport.aiAnalysis.natureOfUptake}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Conclusion:</h4>
                      <p className="text-sm text-gray-700 mt-1">{displayReport.aiAnalysis.conclusion}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Diagnosis Recommendations:</h4>
                      <p className="text-sm text-gray-700 mt-1">{displayReport.aiAnalysis.diagnosisRecommendations}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced MRI Section (radiologist only) */}
              {isRadiologist && job && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Enhanced MRI (Synthetic)</h3>
                    {displayJob.enhancedMriPath ? (
                      <button
                        onClick={handleGenerateEnhanced}
                        disabled={generatingEnhanced}
                        className="text-xs text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
                      >
                        {generatingEnhanced ? 'Regenerating...' : 'Regenerate'}
                      </button>
                    ) : null}
                  </div>

                  {displayJob.enhancedMriPath ? (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <img
                        src={displayJob.enhancedMriPath}
                        alt="Enhanced MRI"
                        className="max-h-96 mx-auto object-contain rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {displayJob.enhancedMriGeneratedAt && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                          Generated: {new Date(displayJob.enhancedMriGeneratedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">No enhanced MRI generated yet.</p>
                      {enhancedError && (
                        <p className="mt-1 text-xs text-red-600">{enhancedError}</p>
                      )}
                      <button
                        onClick={handleGenerateEnhanced}
                        disabled={generatingEnhanced}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300"
                      >
                        {generatingEnhanced ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Enhanced MRI...
                          </>
                        ) : 'Generate Enhanced MRI'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Radiologist Comments (read-only if submitted, editable if not) */}
              {isRadiologist && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Radiologist Review</h3>

                  {submitSuccess ? (
                    <div className="rounded-md bg-green-50 p-4 mb-4">
                      <p className="text-sm text-green-700">{submitSuccess}</p>
                    </div>
                  ) : null}

                  {submitError ? (
                    <div className="rounded-md bg-red-50 p-4 mb-4">
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  ) : null}

                  {canSubmitReport ? (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Comments / Findings
                        </label>
                        <textarea
                          rows={5}
                          value={radiologistComments}
                          onChange={(e) => setRadiologistComments(e.target.value)}
                          placeholder="Enter your radiological findings, corrections to AI analysis, or additional observations..."
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleSubmitReport(true)}
                          disabled={submitting}
                          className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300"
                        >
                          {submitting ? 'Submitting...' : 'Approve & Submit Report'}
                        </button>
                        <button
                          onClick={() => handleSubmitReport(false)}
                          disabled={submitting}
                          className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Submit with Edits
                        </button>
                      </div>
                    </>
                  ) : reportAlreadySubmitted ? (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-800">
                        Report {displayReport.status === 'Approved' ? 'approved' : 'submitted'} by radiologist.
                      </p>
                      {displayReport.radiologistComments && (
                        <p className="mt-2 text-sm text-green-700">{displayReport.radiologistComments}</p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Radiologist Comments for non-radiologist readers (doctor, admin) */}
              {!isRadiologist && displayReport.radiologistComments && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Radiologist Review</h3>
                  <div className={`rounded-lg p-4 ${displayReport.radiologistApproved ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center mb-2">
                      {displayReport.radiologistApproved && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                          Approved
                        </span>
                      )}
                      {displayReport.radiologistSubmittedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(displayReport.radiologistSubmittedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800">{displayReport.radiologistComments}</p>
                  </div>
                </div>
              )}

              {/* Doctor Comments Section */}
              {isDoctor && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Doctor Comments</h3>
                  <p className="text-xs text-gray-500 mb-3">For system records only. Visible to you and the patient via the mobile app.</p>
                  <textarea
                    rows={4}
                    value={doctorComments}
                    onChange={(e) => setDoctorComments(e.target.value)}
                    placeholder="Add your clinical comments, patient follow-up notes, or treatment plan observations..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border mb-3"
                  />
                  {commentSuccess && (
                    <p className="text-sm text-green-600 mb-2">{commentSuccess}</p>
                  )}
                  <button
                    onClick={handleSaveComment}
                    disabled={savingComment || !doctorComments.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300"
                  >
                    {savingComment ? 'Saving...' : 'Save Comments'}
                  </button>
                </div>
              )}

              {/* Doctor Comments read-only (for non-doctor users who can see them) */}
              {!isDoctor && displayReport.doctorComments && ['super-admin', 'hospital-admin'].includes(user?.role) && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Doctor Comments</h3>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-800">{displayReport.doctorComments}</p>
                    {displayReport.doctorCommentedAt && (
                      <p className="text-xs text-purple-400 mt-1">
                        {new Date(displayReport.doctorCommentedAt).toLocaleString()}
                      </p>
                    )}
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
                    Report ID: {id || 'DEMO'}
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

export async function getServerSideProps() {
  return { props: {} };
}

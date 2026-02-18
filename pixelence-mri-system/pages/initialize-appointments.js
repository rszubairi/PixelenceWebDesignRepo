import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function InitializeAppointments() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const seedAppointments = useMutation(api.appointments.seedAppointments);

  const handleInitialize = async () => {
    setLoading(true);
    setStatus('');

    try {
      const res = await seedAppointments();
      setResult(res);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      console.error('Seed appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Initialize Sample Appointments
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click the button below to seed the database with sample appointments
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {status === 'success' && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {result?.message}
                  </h3>
                  {result?.count > 0 && (
                    <p className="mt-1 text-sm text-green-700">
                      {result.count} appointments created with patient details and medical history
                    </p>
                  )}
                  <a
                    href="/appointments"
                    className="mt-3 inline-block font-medium text-green-800 hover:text-green-900 text-sm"
                  >
                    View Appointments
                  </a>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error seeding appointments. Check console for details.
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleInitialize}
              disabled={loading || status === 'success'}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Seeding...' : status === 'success' ? 'Seeded' : 'Seed Sample Appointments'}
            </button>
          </div>

          <div className="text-sm text-gray-600 bg-gray-100 p-4 rounded-md">
            <p className="font-semibold mb-2">What this does:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Creates 5 sample patient appointments in the database</li>
              <li>Each appointment includes patient info, contact details, and medical history</li>
              <li>Appointments have various statuses (Scheduled, DICOM Uploaded, Under Review, Completed)</li>
              <li>Data will appear on the Appointments page</li>
            </ul>
            <p className="mt-3 text-xs">
              Note: If appointments already exist, this will not create duplicates.
            </p>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

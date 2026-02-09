import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function InitializeUsers() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const initializeSampleUsers = useAction(api.initializeSampleUsers.initializeSampleUsers);

  const handleInitialize = async () => {
    setLoading(true);
    setStatus('');
    setResults(null);

    try {
      const result = await initializeSampleUsers();
      setStatus('success');
      setResults(result);
      console.log('Initialization result:', result);
    } catch (err) {
      setStatus('error');
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Initialize Sample Users
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create sample users for testing and demonstration
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {status === 'success' && results && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3 w-full">
                  <h3 className="text-sm font-medium text-green-800">
                    ✓ Sample users initialized successfully!
                  </h3>
                  <div className="mt-4 text-sm text-green-700">
                    <p className="font-semibold mb-2">Summary:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Total processed: {results.totalProcessed}</li>
                      <li>Created: {results.created}</li>
                      <li>Skipped: {results.skipped}</li>
                      <li>Errors: {results.errors}</li>
                    </ul>

                    {results.results && results.results.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold mb-2">Details:</p>
                        <div className="space-y-2">
                          {results.results.map((result, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded ${
                                result.status === 'created'
                                  ? 'bg-green-100'
                                  : result.status === 'skipped'
                                  ? 'bg-yellow-100'
                                  : 'bg-red-100'
                              }`}
                            >
                              <p className="font-mono text-xs">
                                {result.email}: {result.status} - {result.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-green-100 rounded">
                      <p className="font-semibold mb-2">Sample Users Created:</p>
                      <ul className="text-xs font-mono space-y-1">
                        <li>john.smith@hospital.com - IT Administrator</li>
                        <li>emily.johnson@hospital.com - Radiologist</li>
                        <li>michael.brown@hospital.com - Finance User</li>
                        <li>sarah.davis@hospital.com - Radiographer</li>
                        <li>robert.wilson@hospital.com - Doctor</li>
                      </ul>
                      <p className="mt-2 text-xs">All passwords: Click123*</p>
                    </div>

                    <a
                      href="/login"
                      className="mt-4 inline-block font-medium text-green-800 hover:text-green-900"
                    >
                      → Go to Login Page
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error initializing sample users. Check console for details.
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
              {loading
                ? 'Initializing...'
                : status === 'success'
                ? 'Initialized ✓'
                : 'Initialize Sample Users'}
            </button>
          </div>

          <div className="text-sm text-gray-600 bg-gray-100 p-4 rounded-md">
            <p className="font-semibold mb-2">What this does:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Creates 5 sample users with different roles</li>
              <li>All users will have password: Click123*</li>
              <li>Users include: IT Admin, Radiologist, Finance User, Radiographer, Doctor</li>
              <li>Skips users that already exist</li>
            </ul>
          </div>

          <div className="text-center space-y-2">
            <a
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500 block"
            >
              ← Back to Login
            </a>
            <a
              href="/initialize"
              className="text-sm text-blue-600 hover:text-blue-500 block"
            >
              Initialize Default Admin User
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
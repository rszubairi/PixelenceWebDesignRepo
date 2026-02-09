import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function Initialize() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const initializeAdmin = useAction(api.auth.initializeDefaultAdmin);

  const handleInitialize = async () => {
    setLoading(true);
    setStatus('');

    try {
      const result = await initializeAdmin();
      setStatus('success');
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
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Initialize Pixelence MRI System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click the button below to create the default admin user
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {status === 'success' && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    ✓ Default admin user created successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Email: admin@pixelenceai.com</p>
                    <p>Password: Click123*</p>
                    <a 
                      href="/login" 
                      className="mt-3 inline-block font-medium text-green-800 hover:text-green-900"
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
                    Error initializing admin user. Check console for details.
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
              {loading ? 'Initializing...' : status === 'success' ? 'Initialized ✓' : 'Initialize Default Admin User'}
            </button>
          </div>

          <div className="text-sm text-gray-600 bg-gray-100 p-4 rounded-md">
            <p className="font-semibold mb-2">What this does:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Creates the default admin user in Convex</li>
              <li>Email: admin@pixelenceai.com</li>
              <li>Password: Click123* (bcrypt encrypted)</li>
              <li>Role: IT Administrator</li>
            </ul>
            <p className="mt-3 text-xs">
              Note: If the admin user already exists, this will notify you.
            </p>
          </div>

          <div className="text-center">
            <a 
              href="/login" 
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

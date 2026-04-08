import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const COOKIE_NAME = 'pixelence_auth_session';

const DashboardRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    // Get user data from secure cookie
    const userData = Cookies.get(COOKIE_NAME);
    if (userData) {
      const user = JSON.parse(userData);
      // Redirect to role-specific dashboard
      switch (user.role) {
        case 'IT Administrator':
          router.replace('/dashboard/it-admin');
          break;
        case 'Radiologist':
          router.replace('/dashboard/radiologist');
          break;
        case 'Radiographer':
          router.replace('/dashboard/radiographer');
          break;
        case 'Finance User':
          router.replace('/dashboard/finance-user');
          break;
        case 'Doctor':
          router.replace('/dashboard/doctor');
          break;
        default:
          router.replace('/dashboard/it-admin'); // Default fallback
      }
    } else {
      // No user data, redirect to login
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default DashboardRedirect;

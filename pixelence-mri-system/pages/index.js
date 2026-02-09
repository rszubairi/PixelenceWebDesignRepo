import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Redirect to role-specific dashboard
        const dashboardRoutes = {
          'doctor': '/dashboard/doctor',
          'radiologist': '/dashboard/radiologist',
          'radiographer': '/dashboard/radiographer',
          'finance-user': '/dashboard/finance-user',
          'it-admin': '/dashboard/it-admin',
        };
        router.push(dashboardRoutes[user.role] || '/dashboard');
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
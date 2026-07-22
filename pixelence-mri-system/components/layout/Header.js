// components/layout/Header.js
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import Notification from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';

const DASHBOARD_ROUTES = {
  'doctor': '/dashboard/doctor',
  'radiologist': '/dashboard/radiologist',
  'radiographer': '/dashboard/radiographer',
  'finance-user': '/dashboard/finance-user',
  'it-admin': '/dashboard/it-admin',
  'hospital-admin': '/dashboard/hospital-admin',
  'super-admin': '/dashboard/super-admin',
};

const Header = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const unreadCount = useQuery(
    anyApi.notifications.getUnreadCount,
    user?._id ? { userId: user._id } : 'skip'
  ) || 0;

  const handleLogout = () => {
    logout();
  };

  const getNavItems = () => {
    const dashboard = { name: 'Dashboard', href: DASHBOARD_ROUTES[user?.role] || '/login' };

    if (user?.role === 'super-admin') {
      return [
        dashboard,
        { name: 'Hospitals', href: '/super-admin/hospitals' },
        { name: 'Appointments', href: '/appointments' },
        { name: 'Reports', href: '/reports' },
        { name: 'Billing', href: '/billing' },
      ];
    }

    const items = [dashboard, { name: 'Appointments', href: '/appointments' }, { name: 'Reports', href: '/reports' }];

    if (user?.role === 'finance-user' || user?.role === 'it-admin') {
      items.push({ name: 'Billing', href: '/billing' });
    }

    return items;
  };

  const navItems = getNavItems();

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/images/Logo-Black.png"
                alt="Pixelence"
                width={150}
                height={40}
              />
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} legacyBehavior>
                  <a
                    className={`${
                      isActive(item.href)
                        ? 'border-purple-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {/* Notification Bell with live unread badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <Notification
                  onClose={() => setShowNotifications(false)}
                  userId={user?._id}
                />
              )}
            </div>

            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  id="user-menu"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                </button>
              </div>
            </div>

            <div className="ml-3 flex items-center space-x-2">
              <span className="text-xs text-gray-400 hidden sm:inline">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
// components/layout/Layout.js
import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const SIDEBAR_COLLAPSED_KEY = 'pixelence_sidebar_collapsed';

const Layout = ({ user, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="flex">
        <Sidebar userRole={user?.role} collapsed={collapsed} onToggle={toggleCollapsed} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

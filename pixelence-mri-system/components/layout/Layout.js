// components/layout/Layout.js
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ user, children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="flex">
        <Sidebar userRole={user?.role} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

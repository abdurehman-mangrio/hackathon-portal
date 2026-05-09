import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/navigation/AdminSidebar.jsx';

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
import React from 'react';
import { Outlet } from 'react-router-dom';
import MainNavbar from '../components/navigation/MainNavbar';
import UserSidebar from '../components/navigation/UserSidebar';

const TeamLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNavbar />
      
      <div className="flex">
        <UserSidebar />
        
        <main className="flex-1 lg:ml-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeamLayout;
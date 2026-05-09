import React from 'react'
import { Outlet } from 'react-router-dom'
import UserSidebar from '../components/navigation/UserSidebar.jsx'

const UserLayout = () => {
  return (
    <div className="flex h-screen bg-gray-800">
      <UserSidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default UserLayout
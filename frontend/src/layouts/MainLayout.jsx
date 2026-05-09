import React from 'react'
import { Outlet } from 'react-router-dom'
import MainNavbar from '../components/navigation/MainNavbar.jsx'

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <MainNavbar />
      <main className="pt-16">
        <Outlet />
      </main>
      
      {/* Global System Status Footer */}
      <footer className="border-t border-green-500 border-opacity-20 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm text-green-400 font-mono">
            <div>
              <div className="text-green-300">SYSTEM_STATUS</div>
              <div className="text-white font-bold">OPERATIONAL</div>
            </div>
            <div>
              <div className="text-green-300">NETWORK</div>
              <div className="text-white font-bold">SECURE</div>
            </div>
            <div>
              <div className="text-green-300">VERSION</div>
              <div className="text-white font-bold">v2.1.4</div>
            </div>
            <div>
              <div className="text-green-300">UPTIME</div>
              <div className="text-white font-bold">99.97%</div>
            </div>
          </div>
          <div className="text-center text-green-600 text-xs mt-4">
            CYBER_ARENA_CTF © 2024 | SECURE_TRAINING_PLATFORM
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
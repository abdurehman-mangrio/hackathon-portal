// src/components/stats/AdminStats.jsx
import React from 'react'
import { Users, Flag, BarChart3, Server } from 'lucide-react'

const AdminStats = () => {
  const stats = [
    {
      label: 'Total Users',
      value: '1,247',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      label: 'Active Challenges',
      value: '24',
      change: '+3',
      icon: Flag,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      label: 'Submissions Today',
      value: '156',
      change: '+23%',
      icon: BarChart3,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      label: 'System Uptime',
      value: '99.97%',
      change: 'Stable',
      icon: Server,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className={`bg-white border rounded-lg p-6 shadow-sm ${stat.color}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium ${
                stat.change.includes('+') ? 'text-green-600' : 
                stat.change === 'Stable' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AdminStats
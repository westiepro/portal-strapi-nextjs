'use client'

import dynamic from 'next/dynamic'
import { AdminSidebar } from './admin-sidebar'
import { useState } from 'react'

const AdminDashboardClient = dynamic(
  () => import('@/components/admin-dashboard-client').then(mod => ({ default: mod.AdminDashboardClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }
)

interface AdminDashboardWrapperProps {
  initialProperties: any[]
  initialUsers: any[]
  initialAgents: any[]
  initialCompanies: any[]
  stats: {
    totalProperties: number
    publishedProperties: number
    totalUsers: number
    totalAgents: number
  }
}

export function AdminDashboardWrapper(props: AdminDashboardWrapperProps) {
  const [activeTab, setActiveTab] = useState('properties')
  const [activeView, setActiveView] = useState('dashboard')

  return (
    <>
      <AdminSidebar 
        activeTab={activeTab} 
        activeView={activeView}
        onTabChange={setActiveTab}
        onViewChange={setActiveView}
      />
      <div className="flex-1 ml-16">
        {activeView === 'all-properties' ? (
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <AdminDashboardClient {...props} activeTab={activeTab} onTabChange={setActiveTab} showAllProperties={true} />
          </div>
        ) : activeView === 'real-estate-companies' ? (
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <AdminDashboardClient {...props} activeTab={activeTab} onTabChange={setActiveTab} showRealEstateCompanies={true} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage properties and oversee platform operations</p>
            </div>
            <AdminDashboardClient {...props} activeTab={activeTab} onTabChange={setActiveTab} showAllProperties={false} />
          </div>
        )}
      </div>
    </>
  )
}


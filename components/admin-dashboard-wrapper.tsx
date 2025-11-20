'use client'

import dynamic from 'next/dynamic'

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
  stats: {
    totalProperties: number
    publishedProperties: number
    totalUsers: number
    totalAgents: number
  }
}

export function AdminDashboardWrapper(props: AdminDashboardWrapperProps) {
  return <AdminDashboardClient {...props} />
}


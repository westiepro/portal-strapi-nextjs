'use client'

import dynamic from 'next/dynamic'
import { AgentSidebar } from './agent-sidebar'
import { useState } from 'react'

const AgentDashboardClient = dynamic(
  () => import('@/components/agent-dashboard-client').then(mod => ({ default: mod.AgentDashboardClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }
)

interface AgentDashboardWrapperProps {
  initialListings: any[]
  agentProfile: any
  agentId: string | null
  stats: {
    total: number
    published: number
    draft: number
    views: number
  }
  userId: string
  isRealEstateCompany?: boolean
}

export function AgentDashboardWrapper(props: AgentDashboardWrapperProps) {
  const [activeView, setActiveView] = useState('dashboard')

  return (
    <>
      <AgentSidebar 
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <div className="flex-1 ml-16">
        {activeView === 'my-properties' ? (
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <AgentDashboardClient {...props} showMyProperties={true} showDashboard={false} showSettings={false} />
          </div>
        ) : activeView === 'settings' ? (
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <AgentDashboardClient {...props} showMyProperties={false} showDashboard={false} showSettings={true} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
              <p className="text-gray-600">Manage your property listings and track performance.</p>
            </div>
            <AgentDashboardClient {...props} showMyProperties={false} showDashboard={true} showSettings={false} />
          </div>
        )}
      </div>
    </>
  )
}


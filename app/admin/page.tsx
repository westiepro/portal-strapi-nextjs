import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminDashboardWrapper } from '@/components/admin-dashboard-wrapper'
import { createClient } from '@/lib/supabase/server'

async function getAdminData() {
  const supabase = await createClient()

  const [properties, users, agents] = await Promise.all([
    supabase.from('properties').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('agents').select('*').order('created_at', { ascending: false }),
  ])

  return {
    properties: properties.data || [],
    users: users.data || [],
    agents: agents.data || [],
  }
}

export default async function AdminPage() {
  const user = await requireAuth()

  // Only admins can access
  if (user.role !== 'admin') {
    redirect('/')
  }

  const { properties, users, agents } = await getAdminData()

  const stats = {
    totalProperties: properties.length,
    publishedProperties: properties.filter(p => p.status === 'published').length,
    totalUsers: users.length,
    totalAgents: agents.length,
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage properties, users, and agents</p>
        </div>

        <AdminDashboardWrapper
          initialProperties={properties}
          initialUsers={users}
          initialAgents={agents}
          stats={stats}
        />
      </div>
    </div>
  )
}


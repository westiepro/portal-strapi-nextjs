import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminDashboardWrapper } from '@/components/admin-dashboard-wrapper'
import { createClient } from '@/lib/supabase/server'

async function getAdminData() {
  const supabase = await createClient()

  const [properties, users, agents, companies] = await Promise.all([
    supabase
      .from('properties')
      .select(`
        *,
        agents (
          id,
          company_name,
          user_id
        )
      `)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('agents').select('*').order('created_at', { ascending: false }),
    supabase.from('real_estate_companies').select('*').order('created_at', { ascending: false }),
  ])

  return {
    properties: properties.data || [],
    users: users.data || [],
    agents: agents.data || [],
    companies: companies.data || [],
  }
}

export default async function AdminPage() {
  const user = await requireAuth()

  // Only admins can access
  if (user.role !== 'admin') {
    redirect('/')
  }

  const { properties, users, agents, companies } = await getAdminData()

  const stats = {
    totalProperties: properties.length,
    publishedProperties: properties.filter(p => p.status === 'published').length,
    totalUsers: users.length,
    totalAgents: agents.length,
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex">
      <AdminDashboardWrapper
        initialProperties={properties}
        initialUsers={users}
        initialAgents={agents}
        initialCompanies={companies}
        stats={stats}
      />
    </div>
  )
}


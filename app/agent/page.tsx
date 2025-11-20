import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AgentDashboardClient } from '@/components/agent-dashboard-client'
import { createClient } from '@/lib/supabase/server'

async function getAgentListings(userId: string) {
  const supabase = await createClient()

  // Get agent ID
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!agent) {
    return { listings: [], agentId: null }
  }

  // Get agent's properties
  const { data: listings } = await supabase
    .from('properties')
    .select('*')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })

  return { listings: listings || [], agentId: agent.id }
}

async function getAgentProfile(userId: string) {
  const supabase = await createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .single()

  return agent
}

export default async function AgentDashboardPage() {
  const user = await requireAuth()

  // Check if user is agent or admin
  if (!['agent', 'admin'].includes(user.role)) {
    redirect('/')
  }

  const [{ listings, agentId }, agentProfile] = await Promise.all([
    getAgentListings(user.id),
    getAgentProfile(user.id),
  ])

  // Calculate stats
  const stats = {
    total: listings.length,
    published: listings.filter((p: any) => p.status === 'published').length,
    draft: listings.filter((p: any) => p.status === 'draft').length,
    views: listings.reduce((sum: number, p: any) => sum + (p.views || 0), 0),
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
          <p className="text-gray-600">Manage your listings and profile</p>
        </div>

        <AgentDashboardClient
          initialListings={listings}
          agentProfile={agentProfile}
          agentId={agentId}
          stats={stats}
          userId={user.id}
        />
      </div>
    </div>
  )
}


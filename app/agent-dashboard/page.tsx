import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AgentDashboardWrapper } from '@/components/agent-dashboard-wrapper'
import { createClient } from '@/lib/supabase/server'

async function getAgentListings(userId: string) {
  const supabase = await createClient()

  // Get agent ID
  let { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', userId)
    .single()

  // If no agent entry exists, check if user is a real estate company user
  if (!agent) {
    const { data: company, error: companyError } = await supabase
      .from('real_estate_companies')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle() to avoid errors when no company exists

    // If user is a real estate company, create agent entry automatically
    if (company && !companyError) {
      const { data: newAgent, error } = await supabase
        .from('agents')
        .insert({
          user_id: userId,
          company_name: company.company_name,
          phone: company.phone_number || null,
        })
        .select('id')
        .single()

      if (!error && newAgent) {
        agent = newAgent
      }
    }
  }

  // If no agent, check if user is a real estate company
  // Real estate companies can create properties without agent profile (agent_id will be null)
  if (!agent) {
    const { data: company, error: companyError } = await supabase
      .from('real_estate_companies')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle() to avoid errors when no company exists
    
    // If real estate company exists, allow them to proceed but return empty listings
    // Properties without agent_id will need to be fetched separately if needed
    if (company && !companyError) {
      return { listings: [], agentId: null, isRealEstateCompany: true }
    }
    
    return { listings: [], agentId: null, isRealEstateCompany: false }
  }

  // Get agent's properties
  const { data: listings } = await supabase
    .from('properties')
    .select('*')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })

  return { listings: listings || [], agentId: agent.id, isRealEstateCompany: false }
}

async function getAgentProfile(userId: string) {
  const supabase = await createClient()

  let { data: agent } = await supabase
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

  // If no agent entry exists, check if user is a real estate company user
  if (!agent) {
    const { data: company, error: companyError } = await supabase
      .from('real_estate_companies')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle() to avoid errors when no company exists

    // If user is a real estate company, create agent entry automatically
    if (company && !companyError) {
      const { data: newAgent, error } = await supabase
        .from('agents')
        .insert({
          user_id: userId,
          company_name: company.company_name,
          phone: company.phone_number || null,
        })
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .single()

      if (!error && newAgent) {
        agent = newAgent
      }
    }
  }

  return agent
}

export default async function AgentDashboardPage() {
  const user = await requireAuth()

  // Check if user is agent or admin
  if (!['agent', 'admin'].includes(user.role)) {
    redirect('/')
  }

  const [{ listings, agentId, isRealEstateCompany }, agentProfile] = await Promise.all([
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
      <AgentDashboardWrapper
        initialListings={listings}
        agentProfile={agentProfile}
        agentId={agentId}
        stats={stats}
        userId={user.id}
        isRealEstateCompany={isRealEstateCompany}
      />
    </div>
  )
}


import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PropertyCard } from '@/components/property-card'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Globe } from 'lucide-react'
import Link from 'next/link'

async function getAgent(id: string) {
  const supabase = await createClient()

  const { data: agent, error } = await supabase
    .from('agents')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !agent) {
    return null
  }

  return agent
}

async function getAgentProperties(agentId: string) {
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return properties || []
}

interface AgentPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ property_type?: string }>
}

export default async function AgentPage({ params, searchParams }: AgentPageProps) {
  const { id } = await params
  const { property_type } = await searchParams

  const agent = await getAgent(id)
  
  if (!agent) {
    notFound()
  }

  const allProperties = await getAgentProperties(id)
  const properties = property_type
    ? allProperties.filter(p => p.property_type === property_type)
    : allProperties

  const agentProfile = agent.profiles

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Agent Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              {agent.logo_url ? (
                <Avatar className="h-24 w-24">
                  <AvatarImage src={agent.logo_url} alt={agent.company_name || 'Agent'} />
                  <AvatarFallback className="text-2xl">
                    {(agent.company_name || agentProfile?.full_name || 'Agent')[0]}
                  </AvatarFallback>
                </Avatar>
              ) : agentProfile?.avatar_url ? (
                <Avatar className="h-24 w-24">
                  <AvatarImage src={agentProfile.avatar_url} alt={agentProfile.full_name || 'Agent'} />
                  <AvatarFallback className="text-2xl">
                    {(agent.company_name || agentProfile?.full_name || 'Agent')[0]}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl">
                    {(agent.company_name || agentProfile?.full_name || 'Agent')[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {agent.company_name || agentProfile?.full_name || 'Agent'}
                </h1>
                {agent.bio && (
                  <p className="text-gray-700 mb-4">{agent.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {agent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <a href={`tel:${agent.phone}`} className="hover:text-primary">
                        {agent.phone}
                      </a>
                    </div>
                  )}
                  {agentProfile?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <a href={`mailto:${agentProfile.email}`} className="hover:text-primary">
                        {agentProfile.email}
                      </a>
                    </div>
                  )}
                  {agent.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-600" />
                      <a
                        href={agent.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Link href={`/agents/${id}`}>
            <Badge variant={!property_type ? 'default' : 'outline'}>
              All Properties
            </Badge>
          </Link>
          {['apartment', 'villa', 'townhouse', 'land', 'commercial'].map((type) => (
            <Link key={type} href={`/agents/${id}?property_type=${type}`}>
              <Badge variant={property_type === type ? 'default' : 'outline'}>
                {type.charAt(0).toUpperCase() + type.slice(1)}s
              </Badge>
            </Link>
          ))}
        </div>

        {/* Properties Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">
            Properties ({properties.length})
          </h2>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No properties found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


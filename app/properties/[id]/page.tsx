import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PropertyDetailsClient } from '@/components/property-details-client'
import { Map } from '@/components/map'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bed, Bath, Square, MapPin, Phone, Mail, Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

async function getProperty(id: string) {
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      agents (
        id,
        company_name,
        bio,
        phone,
        website,
        logo_url,
        user_id,
        profiles:user_id (
          full_name,
          avatar_url,
          email
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !property) {
    return null
  }

  return property
}

async function trackView(propertyId: string, userId: string | null) {
  if (!userId) return

  const supabase = await createClient()

  // Track recently viewed
  await supabase
    .from('recently_viewed')
    .upsert({
      user_id: userId,
      property_id: propertyId,
      viewed_at: new Date().toISOString(),
    })

  // Increment views
  await supabase.rpc('increment_property_views', { property_id: propertyId })
}

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params
  const property = await getProperty(id)

  if (!property) {
    notFound()
  }

  // Track view if user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await trackView(id, user.id)
  }

  const agent = property.agents
  const agentProfile = agent?.profiles

  const primaryImage = property.images && property.images[0] 
    ? property.images[0] 
    : '/placeholder-property.jpg'

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyDetailsClient property={property} userId={user?.id || null} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={primaryImage}
                    alt={property.title}
                    fill
                    className="object-cover rounded-t-lg"
                    priority
                  />
                </div>
                {property.images && property.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-2">
                    {property.images.slice(1, 5).map((img, idx) => (
                      <div key={idx} className="relative aspect-video">
                        <Image
                          src={img}
                          alt={`${property.title} ${idx + 2}`}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-5 w-5" />
                        <span>{property.location}, {property.city}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      ${property.price.toLocaleString()}
                      {property.listing_type === 'rent' && <span className="text-sm font-normal">/mo</span>}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 py-4 border-y">
                    {property.bed && (
                      <div className="flex items-center gap-2">
                        <Bed className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{property.bed} Bedrooms</span>
                      </div>
                    )}
                    {property.bath && (
                      <div className="flex items-center gap-2">
                        <Bath className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{property.bath} Bathrooms</span>
                      </div>
                    )}
                    {property.area && (
                      <div className="flex items-center gap-2">
                        <Square className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{property.area} sqft</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {property.description || 'No description available.'}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Property Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Property Type:</span>
                      <span className="ml-2 font-medium capitalize">{property.property_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Listing Type:</span>
                      <span className="ml-2 font-medium capitalize">{property.listing_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium capitalize">{property.status}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            {property.latitude && property.longitude && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Location</h2>
                  <div className="h-96 rounded-lg overflow-hidden">
                    <Map
                      properties={[property]}
                      center={[property.longitude, property.latitude]}
                      zoom={15}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Agent Info */}
          <div className="lg:col-span-1">
            {agent && (
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    {agent.logo_url ? (
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarImage src={agent.logo_url} alt={agent.company_name || 'Agent'} />
                        <AvatarFallback>{agent.company_name?.[0] || 'A'}</AvatarFallback>
                      </Avatar>
                    ) : agentProfile?.avatar_url ? (
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarImage src={agentProfile.avatar_url} alt={agentProfile.full_name || 'Agent'} />
                        <AvatarFallback>{agentProfile.full_name?.[0] || 'A'}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarFallback className="text-2xl">
                          {(agent.company_name || agentProfile?.full_name || 'Agent')[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <h3 className="text-xl font-semibold mb-1">
                      {agent.company_name || agentProfile?.full_name || 'Agent'}
                    </h3>
                    {agent.bio && (
                      <p className="text-sm text-gray-600 mb-4">{agent.bio}</p>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    {agent.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <a href={`tel:${agent.phone}`} className="hover:text-primary">
                          {agent.phone}
                        </a>
                      </div>
                    )}
                    {agentProfile?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <a href={`mailto:${agentProfile.email}`} className="hover:text-primary">
                          {agentProfile.email}
                        </a>
                      </div>
                    )}
                    {agent.website && (
                      <div className="flex items-center gap-2 text-sm">
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

                  <Link 
                    href={`/agents/${agent.id}`}
                    className="block w-full text-center py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    View Agent Profile
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


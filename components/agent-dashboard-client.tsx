'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PropertyCard } from '@/components/property-card'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface AgentDashboardClientProps {
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
}

export function AgentDashboardClient({
  initialListings,
  agentProfile,
  agentId,
  stats,
  userId,
}: AgentDashboardClientProps) {
  const router = useRouter()
  const [listings, setListings] = useState(initialListings)

  const deleteListing = async (listingId: string) => {
    const supabase = createClient()
    await supabase.from('properties').delete().eq('id', listingId)
    setListings(listings.filter(l => l.id !== listingId))
  }

  const updateStatus = async (listingId: string, status: string) => {
    const supabase = createClient()
    await supabase
      .from('properties')
      .update({ status })
      .eq('id', listingId)

    setListings(
      listings.map(l => l.id === listingId ? { ...l, status } : l)
    )
  }

  if (!agentProfile && agentId === null) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 mb-4">You need to set up your agent profile first.</p>
          <Button onClick={() => router.push('/agent/setup')}>
            Set Up Agent Profile
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Listings</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-3xl">{stats.published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-3xl">{stats.draft}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Views</CardDescription>
            <CardTitle className="text-3xl">{stats.views}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Listings</h2>
        <Link href="/sell">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Listing
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">You don't have any listings yet.</p>
            <Link href="/sell">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{listing.title}</h3>
                      <Badge variant={listing.status === 'published' ? 'default' : 'secondary'}>
                        {listing.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{listing.location}, {listing.city}</p>
                    <p className="text-2xl font-bold text-primary">
                      ${listing.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <span>{listing.views || 0} views</span>
                      {listing.bed && <span>{listing.bed} bed</span>}
                      {listing.bath && <span>{listing.bath} bath</span>}
                      {listing.area && <span>{listing.area} sqft</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/properties/${listing.id}`}>
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {listing.status === 'published' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(listing.id, 'draft')}
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateStatus(listing.id, 'published')}
                      >
                        Publish
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this listing? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteListing(listing.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Management */}
      {agentId && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Profile</CardTitle>
            <CardDescription>Manage your agent profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Company Name</p>
                <p className="text-gray-600">
                  {agentProfile?.company_name || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Bio</p>
                <p className="text-gray-600">
                  {agentProfile?.bio || 'Not set'}
                </p>
              </div>
              <Link href={`/agents/${agentId}`}>
                <Button variant="outline">View Public Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


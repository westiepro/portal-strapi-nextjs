'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PropertyCard } from '@/components/property-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Search } from 'lucide-react'
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

interface SavedSearch {
  id: string
  name: string
  listing_type: string | null
  city: string | null
  min_price: number | null
  max_price: number | null
  property_type: string[] | null
  min_bed: number | null
  min_bath: number | null
  min_area: number | null
  max_area: number | null
}

interface UserDashboardClientProps {
  savedSearches: SavedSearch[]
  recentlyViewed: any[]
  favorites: any[]
}

export function UserDashboardClient({
  savedSearches,
  recentlyViewed,
  favorites,
}: UserDashboardClientProps) {
  const router = useRouter()
  const [searches, setSearches] = useState(savedSearches)

  const runSearch = (search: SavedSearch) => {
    const params = new URLSearchParams()
    
    if (search.city) params.set('city', search.city)
    if (search.min_price) params.set('min_price', search.min_price.toString())
    if (search.max_price) params.set('max_price', search.max_price.toString())
    if (search.property_type && search.property_type.length > 0) {
      params.set('property_type', search.property_type[0])
    }
    if (search.min_bed) params.set('min_bed', search.min_bed.toString())
    if (search.min_bath) params.set('min_bath', search.min_bath.toString())
    if (search.min_area) params.set('min_area', search.min_area.toString())
    if (search.max_area) params.set('max_area', search.max_area.toString())

    const type = search.listing_type || 'buy'
    router.push(`/${type}?${params.toString()}`)
  }

  const deleteSearch = async (searchId: string) => {
    const supabase = createClient()
    await supabase.from('saved_searches').delete().eq('id', searchId)
    setSearches(searches.filter(s => s.id !== searchId))
  }

  return (
    <Tabs defaultValue="searches" className="space-y-4">
      <TabsList>
        <TabsTrigger value="searches">Saved Searches</TabsTrigger>
        <TabsTrigger value="recent">Recently Viewed</TabsTrigger>
        <TabsTrigger value="favorites">Favorites</TabsTrigger>
      </TabsList>

      <TabsContent value="searches" className="space-y-4">
        {searches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No saved searches yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Save searches from the Buy or Rent pages to see them here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searches.map((search) => (
              <Card key={search.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{search.name}</CardTitle>
                  <CardDescription>
                    {search.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                    {search.city && ` • ${search.city}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    {search.min_price && (
                      <Badge variant="secondary">Min: ${search.min_price.toLocaleString()}</Badge>
                    )}
                    {search.max_price && (
                      <Badge variant="secondary">Max: ${search.max_price.toLocaleString()}</Badge>
                    )}
                    {search.property_type && search.property_type.length > 0 && (
                      <Badge variant="secondary">{search.property_type[0]}</Badge>
                    )}
                    {search.min_bed && (
                      <Badge variant="secondary">{search.min_bed}+ beds</Badge>
                    )}
                    {search.min_bath && (
                      <Badge variant="secondary">{search.min_bath}+ baths</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => runSearch(search)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Run Search
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Saved Search?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this saved search? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSearch(search.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="recent" className="space-y-4">
        {recentlyViewed.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No recently viewed properties.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewed.map((item) => (
              <PropertyCard key={item.property_id} property={item.properties} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="favorites" className="space-y-4">
        {favorites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No favorite properties yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Click the heart icon on properties to save them as favorites.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((item) => (
              <PropertyCard key={item.property_id} property={item.properties} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}


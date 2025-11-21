'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filters, FilterState } from '@/components/filters'
import { PropertyCard } from '@/components/property-card'
import { Map } from '@/components/map'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Property {
  id: string
  title: string
  price: number
  location: string
  city: string
  property_type: string
  bed: number | null
  bath: number | null
  area: number | null
  images: string[] | null
  latitude: number | null
  longitude: number | null
  listing_type: string
}

interface BuyRentPageClientProps {
  listingType: 'buy' | 'rent'
  initialProperties: Property[]
  initialFilters: FilterState
  canSaveSearch: boolean
}

export function BuyRentPageClient({
  listingType,
  initialProperties,
  initialFilters,
  canSaveSearch,
}: BuyRentPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [loading, setLoading] = useState(false)
  const [saveSearchOpen, setSaveSearchOpen] = useState(false)
  const [searchName, setSearchName] = useState('')

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .eq('listing_type', listingType)

      if (filters.city) {
        query = query.eq('city', filters.city)
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice)
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice)
      }
      if (filters.propertyType && filters.propertyType.length > 0) {
        query = query.in('property_type', filters.propertyType)
      }
      if (filters.minBed) {
        query = query.gte('bed', filters.minBed)
      }
      if (filters.minBath) {
        query = query.gte('bath', filters.minBath)
      }
      if (filters.minArea) {
        query = query.gte('area', filters.minArea)
      }
      if (filters.maxArea) {
        query = query.lte('area', filters.maxArea)
      }

      const { data } = await query.order('created_at', { ascending: false })
      setProperties(data || [])
      setLoading(false)
    }

    // Update URL params
    const params = new URLSearchParams(searchParams.toString())
    if (filters.city) params.set('city', filters.city)
    else params.delete('city')
    if (filters.minPrice) params.set('min_price', filters.minPrice.toString())
    else params.delete('min_price')
    if (filters.maxPrice) params.set('max_price', filters.maxPrice.toString())
    else params.delete('max_price')
    if (filters.propertyType && filters.propertyType.length > 0) {
      params.set('property_type', filters.propertyType[0])
    } else params.delete('property_type')
    if (filters.minBed) params.set('min_bed', filters.minBed.toString())
    else params.delete('min_bed')
    if (filters.minBath) params.set('min_bath', filters.minBath.toString())
    else params.delete('min_bath')
    if (filters.minArea) params.set('min_area', filters.minArea.toString())
    else params.delete('min_area')
    if (filters.maxArea) params.set('max_area', filters.maxArea.toString())
    else params.delete('max_area')

    router.replace(`/${listingType}?${params.toString()}`, { scroll: false })
    fetchProperties()
  }, [filters, listingType, router, searchParams])

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    await supabase.from('saved_searches').insert({
      user_id: user.id,
      name: searchName,
      listing_type: listingType,
      city: filters.city,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      property_type: filters.propertyType,
      min_bed: filters.minBed,
      max_bed: filters.maxBed,
      min_bath: filters.minBath,
      max_bath: filters.maxBath,
      min_area: filters.minArea,
      max_area: filters.maxArea,
    })

    setSaveSearchOpen(false)
    setSearchName('')
  }

  // Calculate map center from properties
  const mapCenter = useMemo(() => {
    if (properties.length === 0) return undefined
    const propsWithCoords = properties.filter(p => p.latitude && p.longitude)
    if (propsWithCoords.length === 0) return undefined
    
    const avgLat = propsWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) / propsWithCoords.length
    const avgLng = propsWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) / propsWithCoords.length
    
    return [avgLng, avgLat] as [number, number]
  }, [properties])

  return (
    <>
      <Filters
        listingType={listingType}
        onFilterChange={setFilters}
        canSaveSearch={canSaveSearch}
        onSaveSearch={canSaveSearch ? () => setSaveSearchOpen(true) : undefined}
      />

      <div className="w-full py-8 bg-white">
        <div className="flex flex-col lg:flex-row gap-0">
          {/* Property Cards - 55% width */}
          <div className="w-full lg:w-[55%] px-4 sm:px-6 lg:px-8 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {listingType === 'buy' ? 'Properties for Sale' : 'Properties for Rent'}
              </h2>
              <p className="text-gray-600">{properties.length} properties found</p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No properties found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>

          {/* Map - 45% width, stretches to right edge */}
          <div className="w-full lg:w-[45%] sticky top-24 h-[calc(100vh-8rem)] bg-white">
            <Map
              properties={properties}
              center={mapCenter}
              zoom={12}
            />
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>Give your search a name to save it for later</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="e.g., NYC Apartments under $500k"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <Button onClick={handleSaveSearch} className="w-full">
              Save Search
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


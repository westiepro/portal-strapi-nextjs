import { createClient } from '@/lib/supabase/server'
import { Filters, FilterState } from '@/components/filters'
import { PropertyCard } from '@/components/property-card'
import { Map } from '@/components/map'
import { BuyRentPageClient } from '@/components/buy-rent-client'

async function getProperties(listingType: 'buy' | 'rent', filters: FilterState = {}) {
  const supabase = await createClient()

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

  const { data, error } = await query.order('created_at', { ascending: false })

  return { data, error }
}

interface RentPageProps {
  searchParams: Promise<{
    city?: string
    min_price?: string
    max_price?: string
    property_type?: string
    min_bed?: string
    min_bath?: string
    min_area?: string
    max_area?: string
  }>
}

export default async function RentPage({ searchParams }: RentPageProps) {
  const params = await searchParams
  
  const filters: FilterState = {}
  if (params.city) filters.city = params.city
  if (params.min_price) filters.minPrice = Number(params.min_price)
  if (params.max_price) filters.maxPrice = Number(params.max_price)
  if (params.property_type) filters.propertyType = [params.property_type]
  if (params.min_bed) filters.minBed = Number(params.min_bed)
  if (params.min_bath) filters.minBath = Number(params.min_bath)
  if (params.min_area) filters.minArea = Number(params.min_area)
  if (params.max_area) filters.maxArea = Number(params.max_area)

  const { data: properties } = await getProperties('rent', filters)

  // Get current user for save search
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <BuyRentPageClient
        listingType="rent"
        initialProperties={properties || []}
        initialFilters={filters}
        canSaveSearch={!!user}
      />
    </div>
  )
}


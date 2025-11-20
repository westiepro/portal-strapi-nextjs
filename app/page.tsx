import { createClient } from '@/lib/supabase/server'
import { HeroSearch } from '@/components/hero-search'
import { PropertyCard } from '@/components/property-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Building2, Building, Warehouse, Store } from 'lucide-react'

const propertyTypes = [
  { type: 'apartment', label: 'Apartments', icon: Building2 },
  { type: 'villa', label: 'Villas', icon: Home },
  { type: 'townhouse', label: 'Townhouses', icon: Building },
  { type: 'land', label: 'Land', icon: Warehouse },
  { type: 'commercial', label: 'Commercial', icon: Store },
]

export default async function HomePage() {
  const supabase = await createClient()
  
  // Get featured properties (published, buy or rent)
  const { data: featuredProperties } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'published')
    .in('listing_type', ['buy', 'rent'])
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">
              Find Your Dream Property
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Search thousands of properties for sale and rent
            </p>
          </div>
          <HeroSearch />
        </div>
      </section>

      {/* Property Types */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Browse by Property Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {propertyTypes.map(({ type, label, icon: Icon }) => (
              <Link
                key={type}
                href={`/buy?property_type=${type}`}
                className="group"
              >
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
                  <Icon className="h-12 w-12 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold">{label}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProperties && featuredProperties.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Featured Properties</h2>
              <Link href="/buy">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

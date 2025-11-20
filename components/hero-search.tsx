'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function HeroSearch() {
  const router = useRouter()
  const [listingType, setListingType] = useState<'buy' | 'rent'>('buy')
  const [city, setCity] = useState('')
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    async function loadCities() {
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('city')
        .eq('status', 'published')
      
      if (data) {
        const uniqueCities = [...new Set(data.map(p => p.city).filter(Boolean))]
        setCities(uniqueCities.sort())
      }
    }
    loadCities()
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    
    router.push(`/${listingType}?${params.toString()}`)
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-xl max-w-4xl w-full space-y-4">
      <Tabs value={listingType} onValueChange={(v) => setListingType(v as 'buy' | 'rent')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="rent">Rent</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex gap-2">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={handleSearch} className="px-8">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  )
}


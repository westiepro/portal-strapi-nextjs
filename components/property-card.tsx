'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bed, Bath, Square, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface PropertyCardProps {
  property: {
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
    listing_type: string
  }
  showFavorite?: boolean
}

export function PropertyCard({ property, showFavorite = true }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function checkFavorite() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && showFavorite) {
        setUserId(user.id)
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', property.id)
          .single()
        
        setIsFavorite(!!data)
      }
    }
    checkFavorite()
  }, [property.id, showFavorite])

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      window.location.href = '/login'
      return
    }

    const supabase = createClient()
    
    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', property.id)
      setIsFavorite(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: userId, property_id: property.id })
      setIsFavorite(true)
    }
  }

  const imageUrl = property.images && property.images[0] 
    ? property.images[0] 
    : '/placeholder-property.jpg'

  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative aspect-video">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {showFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              onClick={toggleFavorite}
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
          )}
          <Badge className="absolute top-2 left-2">
            {property.property_type}
          </Badge>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
          <p className="text-2xl font-bold text-primary">
            ${property.price.toLocaleString()}
            {property.listing_type === 'rent' && <span className="text-sm font-normal text-gray-600">/mo</span>}
          </p>
          <p className="text-sm text-gray-600">{property.location}, {property.city}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {property.bed && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.bed}</span>
              </div>
            )}
            {property.bath && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.bath}</span>
              </div>
            )}
            {property.area && (
              <div className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                <span>{property.area} sqft</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}


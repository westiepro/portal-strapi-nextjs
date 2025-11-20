'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PropertyDetailsClientProps {
  property: any
  userId: string | null
}

export function PropertyDetailsClient({ property, userId }: PropertyDetailsClientProps) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkFavorite() {
      if (!userId) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', property.id)
        .single()

      setIsFavorite(!!data)
      setLoading(false)
    }

    checkFavorite()
  }, [property.id, userId])

  const toggleFavorite = async () => {
    if (!userId) {
      router.push('/login')
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

  if (loading) return null

  return (
    <div className="flex justify-end mb-4">
      <Button
        variant={isFavorite ? "default" : "outline"}
        onClick={toggleFavorite}
      >
        <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
        {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      </Button>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { PropertyCard } from '@/components/property-card'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
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

interface Favourite {
  id: string
  property_id: string
  properties: any
}

interface FavouritesClientProps {
  initialFavorites: Favourite[]
}

export function FavouritesClient({ initialFavorites }: FavouritesClientProps) {
  const [favorites, setFavorites] = useState(initialFavorites)

  const removeFavorite = async (favoriteId: string, propertyId: string) => {
    const supabase = createClient()
    await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)

    setFavorites(favorites.filter(f => f.id !== favoriteId))
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg mb-4">You haven't saved any favorites yet.</p>
        <p className="text-gray-500">Browse properties and click the heart icon to save them!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((favorite) => (
        <div key={favorite.id} className="relative group">
          <PropertyCard property={favorite.properties} showFavorite={false} />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from Favorites?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this property from your favorites?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => removeFavorite(favorite.id, favorite.property_id)}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  )
}


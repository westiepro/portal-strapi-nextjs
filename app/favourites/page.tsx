import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { FavouritesClient } from '@/components/favourites-client'

async function getFavorites(userId: string) {
  const supabase = await createClient()

  const { data: favorites } = await supabase
    .from('favorites')
    .select(`
      *,
      properties (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return favorites || []
}

export default async function FavouritesPage() {
  const user = await requireAuth()
  const favorites = await getFavorites(user.id)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
          <p className="text-gray-600">Properties you've saved</p>
        </div>

        <FavouritesClient initialFavorites={favorites} />
      </div>
    </div>
  )
}


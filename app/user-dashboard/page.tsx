import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { UserDashboardClient } from '@/components/user-dashboard-client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

async function getSavedSearches(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return data || []
}

async function getRecentlyViewed(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('recently_viewed')
    .select(`
      *,
      properties (*)
    `)
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(10)

  return data || []
}

async function getFavorites(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('favorites')
    .select(`
      *,
      properties (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  return data || []
}

export default async function DashboardPage() {
  const user = await requireAuth()

  const [savedSearches, recentlyViewed, favorites] = await Promise.all([
    getSavedSearches(user.id),
    getRecentlyViewed(user.id),
    getFavorites(user.id),
  ])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Dashboard</h1>
          <p className="text-gray-600">Manage your saved searches, recent views, and favorites</p>
        </div>

        <UserDashboardClient
          savedSearches={savedSearches}
          recentlyViewed={recentlyViewed}
          favorites={favorites}
        />
      </div>
    </div>
  )
}


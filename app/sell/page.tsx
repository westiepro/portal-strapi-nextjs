import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SellPageClient } from '@/components/sell-page-client'

export default async function SellPage() {
  const user = await requireAuth()

  // Check if user is agent or admin
  if (!['agent', 'admin'].includes(user.role)) {
    redirect('/')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">List a Property</h1>
          <p className="text-gray-600">Create a new property listing</p>
        </div>
        <SellPageClient userId={user.id} role={user.role} />
      </div>
    </div>
  )
}


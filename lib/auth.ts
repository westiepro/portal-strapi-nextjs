import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'user' | 'agent' | 'admin'

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: UserRole
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile || null
}

export async function requireAuth(requiredRole?: UserRole): Promise<UserProfile> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (requiredRole) {
    if (requiredRole === 'admin' && user.role !== 'admin') {
      redirect('/')
    }
    if (requiredRole === 'agent' && !['agent', 'admin'].includes(user.role)) {
      redirect('/')
    }
  }

  return user
}

export async function checkRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile) return false

  if (requiredRole === 'admin') {
    return profile.role === 'admin'
  }
  
  if (requiredRole === 'agent') {
    return ['agent', 'admin'].includes(profile.role)
  }

  return true
}


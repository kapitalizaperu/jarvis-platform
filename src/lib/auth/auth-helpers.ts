import { supabase } from './supabase-client'
import type { JarvisUser, UserRole } from './types'

export async function signUp(email: string, password: string, name: string, role: UserRole = 'agency') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role, full_name: name }
    }
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser(): Promise<JarvisUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name || user.email!.split('@')[0],
    role: (user.user_metadata?.role as UserRole) || 'agency',
    tenantId: user.id, // default tenant = user ID until org is created
    createdAt: user.created_at
  }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/reset-password`
  })
  if (error) throw error
}

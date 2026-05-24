import { redirect } from 'react-router'
import { createServerSupabase } from './supabase.server'

export async function requireAuth(request: Request) {
  const { supabase } = createServerSupabase(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw redirect('/auth/login')
  return user
}

export async function requireGuest(request: Request) {
  const { supabase } = createServerSupabase(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) throw redirect('/app')
}

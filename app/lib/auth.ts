import { redirect } from 'react-router'
import { supabase } from './supabase'

export async function requireAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw redirect('/auth/login')
  return user
}

export async function requireGuest() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) throw redirect('/app')
}

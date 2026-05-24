import { redirect } from 'react-router'
import { authService } from '~/services/auth.service'

export async function requireAuth() {
  const { data: user } = await authService.getUser()
  if (!user) throw redirect('/auth/login')
  return user
}

export async function requireGuest() {
  const { data: user } = await authService.getUser()
  if (user) throw redirect('/app')
}
import { supabase } from '~/lib/supabase'
import type { Result } from '~/core/types/common.types'
import type { User, Session, AuthError } from '@supabase/supabase-js'

type AuthResult = Result<{ user: User; session: Session }, AuthError>
type SessionResult = Result<Session | null, AuthError>
type UserResult = Result<User | null, AuthError>

export const authService = {
  async signUp(email: string, password: string, username: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }   // trigger → profiles.username
      }
    })

    if (error || !data.user || !data.session) {
      return { data: null, error: error! }
    }

    return { data: { user: data.user, session: data.session }, error: null }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user || !data.session) {
      return { data: null, error: error! }
    }

    return { data: { user: data.user, session: data.session }, error: null }
  },

  async signOut(): Promise<Result<null, AuthError>> {
    const { error } = await supabase.auth.signOut()
    if (error) return { data: null, error }
    return { data: null, error: null }
  },

  async getSession(): Promise<SessionResult> {
    const { data, error } = await supabase.auth.getSession()
    if (error) return { data: null, error }
    return { data: data.session, error: null }
  },

  async getUser(): Promise<UserResult> {
    const { data, error } = await supabase.auth.getUser()
    if (error) return { data: null, error }
    return { data: data.user, error: null }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
  }
}
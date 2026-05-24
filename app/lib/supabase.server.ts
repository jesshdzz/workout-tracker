import { createServerClient, serializeCookieHeader } from '@supabase/ssr'
import type { Database } from '~/core/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

export function createServerSupabase(request: Request) {
  const headers = new Headers()

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookie = request.headers.get('Cookie') ?? ''
        return cookie.split('; ').filter(Boolean).map(c => {
          const sep = c.indexOf('=')
          return {
            name: c.slice(0, sep),
            value: c.slice(sep + 1),
          }
        })
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
        })
      },
    },
  })

  return { supabase, headers }
}

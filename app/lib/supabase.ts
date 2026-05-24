import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/core/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase')
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

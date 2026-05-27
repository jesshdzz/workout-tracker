import { supabase } from '~/lib/supabase'
// import { createServerSupabase } from '~/lib/supabase.server'
import { BaseRepository } from './base.repository'
import { type Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']

export class SessionsRepository extends BaseRepository {
  async findByUser(userId: string, limit = 20): Promise<Result<Session[]>> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        routines(id, name),
        sets(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return this.handle(data, error)
  }

  async findById(id: string): Promise<Result<Session>> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        routines(id, name),
        sets(
          *,
          exercises(id, name, name_es, slug)
        )
      `)
      .eq('id', id)
      .maybeSingle()
    return this.handle(data, error)
  }

  // async serverFindById(id: string, request: Request): Promise<Result<Session>> {
  //   const { supabase } = createServerSupabase(request)
  //   const { data: session, error } = await supabase
  //     .from('sessions')
  //     .select(`*, routines(id, name), sets(*, exercises(id, name, name_es, slug))`)
  //     .eq('id', id)
  //     .maybeSingle()

  //   if (error || !session) {
  //     throw new Response('Sesión no encontrada', { status: 404 })
  //   }
  //   return { data: session, error: null }

  // }

  async findWithSets(id: string): Promise<Result<Session>> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
      *,
      routines(id, name),
      sets(
        *,
        exercises(id, name, name_es, slug)
      )
    `)
      .eq('id', id)
      .maybeSingle()

    return this.handle(data, error)
  }

  async findActive(userId: string): Promise<Result<Session | null>> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return this.handle(data, error)
  }

  async create(session: SessionInsert): Promise<Result<Session>> {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single()
    return this.handle(data, error)
  }

  async complete(id: string, updates: Partial<Session>): Promise<Result<Session>> {
    const { data, error } = await supabase
      .from('sessions')
      .update({ ...updates, completed: true })
      .eq('id', id)
      .select()
      .single()
    return this.handle(data, error)
  }

  async discardSession(sessionId: string): Promise<Result<null>> {
    await supabase
      .from('sets')
      .delete()
      .eq('session_id', sessionId)

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    return this.handle(null, error)
  }
}

export const sessionsRepository = new SessionsRepository()
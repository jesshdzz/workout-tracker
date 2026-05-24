// app/repositories/sessions.repository.ts
import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
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
      .order('date', { ascending: false })
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
      .single()
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

  async complete(id: string, durationSeconds?: number): Promise<Result<Session>> {
    const { data, error } = await supabase
      .from('sessions')
      .update({ completed: true, duration_s: durationSeconds ?? null })
      .eq('id', id)
      .select()
      .single()
    return this.handle(data, error)
  }
}

export const sessionsRepository = new SessionsRepository()
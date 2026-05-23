// app/repositories/sets.repository.ts
import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type Set = Database['public']['Tables']['sets']['Row']
type SetInsert = Database['public']['Tables']['sets']['Insert']
type SetUpdate = Database['public']['Tables']['sets']['Update']

export class SetsRepository extends BaseRepository {
  async findBySession(sessionId: string): Promise<Result<Set[]>> {
    const { data, error } = await supabase
      .from('sets')
      .select(`
        *,
        exercises(id, name, name_es, slug)
      `)
      .eq('session_id', sessionId)
      .order('set_number')
    return this.handle(data, error)
  }

  async create(set: SetInsert): Promise<Result<Set>> {
    const { data, error } = await supabase
      .from('sets')
      .insert(set)
      .select()
      .single()
    return this.handle(data, error)
  }

  async update(id: string, updates: SetUpdate): Promise<Result<Set>> {
    const { data, error } = await supabase
      .from('sets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return this.handle(data, error)
  }

  async delete(id: string): Promise<Result<null>> {
    const { error } = await supabase.from('sets').delete().eq('id', id)
    return this.handle(error ? null : null, error ?? null)
  }
}

export const setsRepository = new SetsRepository()
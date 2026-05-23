// app/repositories/routines.repository.ts
import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type Routine = Database['public']['Tables']['routines']['Row']
type RoutineInsert = Database['public']['Tables']['routines']['Insert']
type RoutineUpdate = Database['public']['Tables']['routines']['Update']

export class RoutinesRepository extends BaseRepository {
  async findByUser(userId: string): Promise<Result<Routine[]>> {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        routine_exercises(
          *,
          exercises(id, name, name_es, slug)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return this.handle(data, error)
  }

  async findById(id: string): Promise<Result<Routine>> {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        routine_exercises(
          *,
          exercises(
            *,
            exercise_muscles(role, muscle_groups(slug, name_es))
          )
        )
      `)
      .eq('id', id)
      .single()
    return this.handle(data, error)
  }

  async create(routine: RoutineInsert): Promise<Result<Routine>> {
    const { data, error } = await supabase
      .from('routines')
      .insert(routine)
      .select()
      .single()
    return this.handle(data, error)
  }

  async update(id: string, updates: RoutineUpdate): Promise<Result<Routine>> {
    const { data, error } = await supabase
      .from('routines')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return this.handle(data, error)
  }

  async delete(id: string): Promise<Result<null>> {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id)
    return this.handle(error ? null : null, error ?? null)
  }
}

export const routinesRepository = new RoutinesRepository()
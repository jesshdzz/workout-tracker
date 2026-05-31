import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type Set = Database['public']['Tables']['sets']['Row']
type SetInsert = Database['public']['Tables']['sets']['Insert']
type SetUpdate = Database['public']['Tables']['sets']['Update']
export type SetWithSession = Pick<
  Set,
  | 'set_number'
  | 'set_type'
  | 'technique'
  | 'weight'
  | 'weight_unit'
  | 'reps'
  | 'rest_pause_reps'
  | 'drop_weight'
  | 'drop_reps'
  | 'is_pr'
> & {
  sessions: {
    id: string
    name: string | null
    date: string | null
    completed: boolean | null
    user_id: string | null
  }
}

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

  async findLastByExercise(userId: string, exerciseId: string, currentSessionId: string | null): Promise<Result<SetWithSession[]>> {
    const { data, error } = await supabase
      .from('sets')
      .select(`
          set_number,
          set_type,
          technique,
          weight,
          weight_unit,
          reps,
          rest_pause_reps,
          drop_weight,
          drop_reps,
          is_pr,
          sessions!inner(
            id,
            name,
            date,
            completed,
            user_id
          )
        `)
      .eq('exercise_id', exerciseId)
      .eq('sessions.user_id', userId)
      .eq('sessions.completed', true)
      .neq('sessions.id', currentSessionId ?? '')
      .order('sessions(date)', { ascending: false })
      .limit(20)

    return this.handle(data, error)
  }

  async create(set: SetInsert): Promise<Result<Set>> {
    const { data, error } = await supabase
      .from('sets')
      .upsert(set, { onConflict: 'id' })
      .select()
      .single()
    return this.handle(data, error)
  }

  async upsert(set: SetInsert): Promise<Result<Set>> {
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

  // async updateSet(setId: string,
  //   updates: {
  //     weight?: number
  //     reps?: number
  //     restPauseReps?: number
  //     dropWeight?: number
  //     dropReps?: number
  //     rirPerceived?: number
  //     technique?: string
  //   }): Promise<Result<null>> {
  //   const { error } = await supabase
  //     .from('sets')
  //     .update({
  //       weight: updates.weight,
  //       reps: updates.reps,
  //       rest_pause_reps: updates.restPauseReps,
  //       drop_weight: updates.dropWeight,
  //       drop_reps: updates.dropReps,
  //       rir_perceived: updates.rirPerceived,
  //       technique: updates.technique,
  //     })
  //     .eq('id', setId)

  //   return this.handle(null, error)
  // }

  async delete(id: string): Promise<Result<null>> {
    const { error } = await supabase.from('sets').delete().eq('id', id)
    return this.handle(error ? null : null, error ?? null)
  }

  async setsCountBySessionIds(sessionIds: string[]): Promise<Result<{ session_id: string | null}[]>> {
    const { data, error } = await supabase
      .from('sets')
      .select('session_id')
      .in('session_id', sessionIds)
      .eq('set_type', 'effective')

    return this.handle(data, error)
  }
}

export const setsRepository = new SetsRepository()
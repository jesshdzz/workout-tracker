import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type RM = Database['public']['Tables']['personal_rms']['Row']
type RMInsert = Database['public']['Tables']['personal_rms']['Insert']
type orderType = 'rm_kg' | 'tested_at' | 'created_at'

export class RMsRepository extends BaseRepository {
  async findByUser(userId: string, order: orderType = 'created_at', ascending: boolean): Promise<Result<RM[]>> {
    const { data, error } = await supabase
      .from('personal_rms')
      .select('*, exercises(id, name, name_es, slug)')
      .eq('user_id', userId)
      .order(order, { ascending })
    return this.handle(data, error)
  }

  async findByExercise(userId: string, exerciseId: string): Promise<Result<RM>> {
    const { data, error } = await supabase
      .from('personal_rms')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .maybeSingle()
    return this.handle(data, error)
  }

  async upsert(rm: RMInsert): Promise<Result<RM>> {
    const { data, error } = await supabase
      .from('personal_rms')
      .upsert(rm, { onConflict: 'user_id,exercise_id' })
      .select()
      .single()
    return this.handle(data, error)
  }
}

export const rmsRepository = new RMsRepository()
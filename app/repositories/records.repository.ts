import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'
import type { RecordType } from '~/core/types/common.types'

type PR = Database['public']['Tables']['personal_records']['Row']
type PRExercise = Database['public']['Tables']['personal_records']['Row'] & {
  exercises: {
    id: string
    name: string
    name_es: string | null
    slug: string
  }
}
type PRInsert = Database['public']['Tables']['personal_records']['Insert']

export class RecordsRepository extends BaseRepository {
  async findByUser(
    userId: string,
    type: RecordType = 'estimated_1rm',
    orderField: string = 'achieved_at',
    ascending: boolean = false
  ): Promise<Result<PRExercise[]>> {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*, exercises(id, name, name_es, slug)')
      .eq('user_id', userId)
      .eq('record_type', type)
      .order(orderField, { ascending })
    return this.handle(data, error)
  }

  async findBest(
    exerciseId: string,
    type: RecordType
  ): Promise<Result<PR | null>> {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('exercise_id', exerciseId)
      .eq('record_type', type)
      .order('value', { ascending: false })
      .limit(1)
      .maybeSingle()
    return this.handle(data, error)
  }

  async create(record: PRInsert): Promise<Result<PR>> {
    const { data, error } = await supabase
      .from('personal_records')
      .insert(record)
      .select()
      .single()
    return this.handle(data, error)
  }
}

export const recordsRepository = new RecordsRepository()
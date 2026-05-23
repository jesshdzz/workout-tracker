import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

export class ExercisesRepository extends BaseRepository {
  async findAll(): Promise<Result<Exercise[]>> {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_muscles(
          role,
          muscle_groups(slug, name_es, body_region)
        )
      `)
      .order('sort_order')
    return this.handle(data, error)
  }

  async findBySlug(slug: string): Promise<Result<Exercise>> {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_muscles(
          role,
          muscle_groups(slug, name_es, body_region)
        )
      `)
      .eq('slug', slug)
      .single()
    return this.handle(data, error)
  }

  async findByMuscleGroup(muscleSlug: string): Promise<Result<Exercise[]>> {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_muscles!inner(
          role,
          muscle_groups!inner(slug, name_es, body_region)
        )
      `)
      .eq('exercise_muscles.muscle_groups.slug', muscleSlug)
      .order('sort_order')
    return this.handle(data, error)
  }
}

export const exercisesRepository = new ExercisesRepository()
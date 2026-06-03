import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import { AppServiceError, type Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type Routine = Database['public']['Tables']['routines']['Row']
type RoutineInsert = Database['public']['Tables']['routines']['Insert']
type RoutineUpdate = Database['public']['Tables']['routines']['Update']
type RoutineExerciseInsert = Database['public']['Tables']['routine_exercises']['Insert']

export type RoutineWithExercises = Routine & {
  routine_exercises: {
    id: string
    sort_order: number
    target_sets: number | null
    target_reps: string | null
    target_rir: number | null
    intensity_pct: number | null
    notes: string | null
    set_type: string | null
    exercises: {
      id: string
      name: string
      name_es: string | null
      slug: string
      is_compound: boolean | null
    } | null
  }[]
  last_used?: string | null
}

export class RoutinesRepository extends BaseRepository {
  async findByUser(userId: string): Promise<Result<RoutineWithExercises[]>> {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        routine_exercises(
          id,
          sort_order,
          target_sets,
          target_reps,
          target_rir,
          intensity_pct,
          notes,
          set_type,
          exercises(id, name, name_es, slug, is_compound)
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) return { data: null, error }

    // Enriquece con última sesión usada
    if (!data || data.length === 0) return { data: [], error: null }

    const routineIds = data.map(r => r.id)
    const { data: sessions } = await supabase
      .from('sessions')
      .select('routine_id, date')
      .in('routine_id', routineIds)
      .eq('completed', true)
      .order('date', { ascending: false })

    const lastUsedMap = new Map<string, string>()
    for (const s of sessions ?? []) {
      if (s.routine_id && !lastUsedMap.has(s.routine_id)) {
        lastUsedMap.set(s.routine_id, s.date)
      }
    }

    return {
      data: data.map(r => ({
        ...r,
        routine_exercises: [...(r.routine_exercises ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
        last_used: lastUsedMap.get(r.id) ?? null,
      })) as RoutineWithExercises[],
      error: null,
    }
  }

  async findById(id: string): Promise<Result<RoutineWithExercises>> {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        routine_exercises(
          id,
          sort_order,
          target_sets,
          target_reps,
          target_rir,
          intensity_pct,
          notes,
          set_type,
          exercises(id, name, name_es, slug, is_compound)
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) return { data: null, error }
    if (!data) return {
      data: null,
      error: new AppServiceError('Rutina no encontrada', 'ROUTINE_NOT_FOUND') as any,
    }

    return {
      data: {
        ...data,
        routine_exercises: [...(data.routine_exercises ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      } as RoutineWithExercises,
      error: null,
    }
  }

  async create(
    routine: RoutineInsert,
    exercises: Omit<RoutineExerciseInsert, 'routine_id'>[]
  ): Promise<Result<RoutineWithExercises>> {
    const { data: routineData, error: routineError } = await supabase
      .from('routines')
      .insert(routine)
      .select()
      .single()

    if (routineError || !routineData) return { data: null, error: routineError! }

    if (exercises.length > 0) {
      const { error: exError } = await supabase
        .from('routine_exercises')
        .insert(exercises.map((ex, i) => ({
          ...ex,
          routine_id: routineData.id,
          sort_order: ex.sort_order ?? i,
        })))

      if (exError) return { data: null, error: exError }
    }

    return this.findById(routineData.id)
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

  async rename(id: string, name: string): Promise<Result<Routine>> {
    return this.update(id, { name })
  }

  async duplicate(
    routineId: string,
    userId: string
  ): Promise<Result<RoutineWithExercises>> {
    const original = await this.findById(routineId)
    if (original.error || !original.data) return { data: null, error: original.error! }

    return this.create(
      {
        user_id: userId,
        name: `${original.data.name} (copia)`,
        description: original.data.description,
        is_public: false,
      },
      original.data.routine_exercises.map((ex, i) => ({
        exercise_id: ex.exercises?.id ?? '',
        sort_order: i,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        target_rir: ex.target_rir,
        intensity_pct: ex.intensity_pct,
      }))
    )
  }

  async delete(id: string): Promise<Result<null>> {
    // routine_exercises se eliminan en cascada
    const { error } = await supabase.from('routines').delete().eq('id', id)
    if (error) return { data: null, error }
    return { data: null, error: null }
  }

  async syncExercises(
    routineId: string,
    exercises: Omit<RoutineExerciseInsert, 'routine_id'>[]
  ): Promise<Result<null>> {
    // Borra todos y reinserta — más simple que diff
    await supabase.from('routine_exercises').delete().eq('routine_id', routineId)

    if (exercises.length > 0) {
      const { error } = await supabase
        .from('routine_exercises')
        .insert(exercises.map((ex, i) => ({
          ...ex,
          routine_id: routineId,
          sort_order: i,
        })))

      if (error) return { data: null, error }
    }

    return { data: null, error: null }
  }
}

export const routinesRepository = new RoutinesRepository()
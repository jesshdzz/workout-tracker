import { supabase } from '~/lib/supabase'
import { sessionsRepository } from '~/repositories/sessions.repository'
import { setsRepository, type SetWithSession } from '~/repositories/sets.repository'
import { recordsRepository } from '~/repositories/records.repository'
import { calcRM } from '~/core/utils/epley'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'
import type { ActiveSet } from '~/features/training/store/session.store'

type Session = Database['public']['Tables']['sessions']['Row']

type LogSetInput = {
  exerciseId: string
  setNumber: number
  setType: 'warmup' | 'effective'
  technique: 'normal' | 'rest_pause' | 'drop_set' | 'failure'
  weight: number
  weightUnit: 'kg' | 'lb'
  reps: number
  restPauseReps?: number
  dropWeight?: number
  dropReps?: number
  rirPerceived: number
}

type LogSetResult = {
  id: string
  isPR: boolean
  estimatedRM: number
}

export const workoutService = {
  async startSession(
    userId: string,
    options?: { routineId?: string; name?: string; weekNumber?: number; blockNumber?: number }
  ): Promise<Result<Session>> {
    // Verificar si ya hay una sesión activa sin terminar
    const active = await sessionsRepository.findActive(userId)
    if (active.data) return { data: active.data, error: null }

    let weekNumber = options?.weekNumber ?? null
    let blockNumber = options?.blockNumber ?? null

    if (weekNumber === null) {
      const { data: progState } = await supabase
        .from('user_program_state')
        .select('current_week, current_block')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()
      if (progState) {
        weekNumber = progState.current_week
        blockNumber = progState.current_block
      } else {
        weekNumber = 1
        blockNumber = 1
      }
    }

    return sessionsRepository.create({
      user_id: userId,
      routine_id: options?.routineId ?? null,
      name: options?.name ?? null,
      date: new Date().toISOString().split('T')[0],
      week_number: weekNumber,
      block_number: blockNumber,
      completed: false,
    })
  },

  /**
   * Registra una serie localmente SIN fetch a la BD.
   * Devuelve el ID local y si es un nuevo récord personal (estimado).
   * El parámetro `prMap` es mutado en memoria para detectar PRs intra-sesión.
   *
   * El flush real a Supabase ocurre SOLO al llamar finishSession().
   */
  logSet(input: LogSetInput, prMap: Map<string, number>): LogSetResult {
    const localId = crypto.randomUUID()
    const estimatedRM = calcRM(input.weight, input.reps)
    const currentBest = prMap.get(input.exerciseId) ?? 0
    const isPR = input.setType === 'effective' && estimatedRM > currentBest

    // Actualizar el mapa para comparaciones intra-sesión
    if (isPR) prMap.set(input.exerciseId, estimatedRM)

    return { id: localId, isPR, estimatedRM }
  },

  /**
   * Guarda la sesión completa en Supabase:
   * 1. Bulk-insert de TODAS las series (una sola llamada a la BD)
   * 2. Calcular y guardar PRs en paralelo (async-parallel)
   * 3. Marcar sesión como completada
   *
   * Este es el ÚNICO momento en que se escriben sets en Supabase durante un entreno.
   */
  async finishSession(
    sessionId: string,
    durationSeconds: number,
    sets: ActiveSet[],
    userId: string
  ): Promise<Result<Session>> {
    // 1. Bulk-insert de todas las series en una sola llamada (supabase-postgres-best-practices: query-batch)
    if (sets.length > 0) {
      const setsPayload = sets.map(s => ({
        id: s.id,
        session_id: sessionId,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        set_type: s.setType,
        technique: s.technique,
        weight: s.weight,
        weight_unit: s.weightUnit,
        reps: s.reps,
        rest_pause_reps: s.restPauseReps ?? null,
        drop_weight: s.dropWeight ?? null,
        drop_reps: s.dropReps ?? null,
        rir_perceived: s.rirPerceived,
        is_pr: s.isPR,
        completed: true,
      }))

      const { error: setsError } = await supabase.from('sets').insert(setsPayload)
      if (setsError) return { data: null, error: setsError }
    }

    // 2. Calcular el mejor 1RM estimado por ejercicio de esta sesión
    const effectiveSets = sets.filter(s => s.setType === 'effective')
    const sessionBestRM = new Map<string, { rm: number; setId: string }>()
    for (const s of effectiveSets) {
      const rm = calcRM(s.weight, s.reps)
      const current = sessionBestRM.get(s.exerciseId)
      if (!current || rm > current.rm) {
        sessionBestRM.set(s.exerciseId, { rm, setId: s.id })
      }
    }

    // 3. Comparar con PRs existentes y guardar los nuevos (en paralelo — async-parallel)
    await Promise.all(
      Array.from(sessionBestRM.entries()).map(async ([exerciseId, { rm, setId }]) => {
        const existing = await recordsRepository.findBest(exerciseId, 'estimated_1rm')
        if (!existing.data || rm > existing.data.value) {
          await recordsRepository.create({
            user_id: userId,
            exercise_id: exerciseId,
            record_type: 'estimated_1rm',
            value: rm,
            set_id: setId,
            achieved_at: new Date().toISOString().split('T')[0],
          })
        }
      })
    )

    // 4. Marcar sesión como completada
    return sessionsRepository.complete(sessionId, { duration_s: durationSeconds })
  },

  async getActiveSession(userId: string): Promise<Result<Session | null>> {
    return sessionsRepository.findActive(userId)
  },

  /**
   * Descarta la sesión: elimina únicamente la fila de sesión en BD.
   * Durante una sesión activa los sets NUNCA se escriben en Supabase
   * (arquitectura local-first), por lo que no hay sets que limpiar.
   */
  async discardSession(sessionId: string): Promise<Result<null>> {
    return sessionsRepository.discardSession(sessionId)
  },

  async getExerciseHistory(
    exerciseId: string,
    userId: string,
    currentSessionId: string | null
  ): Promise<Result<SetWithSession[]>> {
    return setsRepository.findLastByExercise(userId, exerciseId, currentSessionId)
  },
}
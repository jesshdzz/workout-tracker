import { sessionsRepository } from '~/repositories/sessions.repository'
import { setsRepository, type SetWithSession } from '~/repositories/sets.repository'
import { recordsRepository } from '~/repositories/records.repository'
import { calcRM } from '~/core/utils/epley'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'
import { drainQueue, enqueue, getQueue, removeFromQueue } from '~/core/sync/syncQueue'

type Session = Database['public']['Tables']['sessions']['Row']
type Set = Database['public']['Tables']['sets']['Row']

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
  set: Set
  isPR: boolean
  newRM: number | null
}

export const workoutService = {
  async startSession(
    userId: string,
    options?: { routineId?: string; name?: string; weekNumber?: number; blockNumber?: number }
  ): Promise<Result<Session>> {
    // Verificar si ya hay una sesión activa sin terminar
    const active = await sessionsRepository.findActive(userId)
    if (active.data) return { data: active.data, error: null }

    return sessionsRepository.create({
      user_id: userId,
      routine_id: options?.routineId ?? null,
      name: options?.name ?? null,
      date: new Date().toISOString().split('T')[0],
      week_number: options?.weekNumber ?? null,
      block_number: options?.blockNumber ?? null,
      completed: false,
    })
  },

  async logSet(sessionId: string, userId: string, input: LogSetInput) {
    // 1. Genera un UUID local para la serie
    const localId = crypto.randomUUID()

    const payload = {
      id: localId,
      session_id: sessionId,
      exercise_id: input.exerciseId,
      set_number: input.setNumber,
      set_type: input.setType,
      technique: input.technique,
      weight: input.weight,
      weight_unit: input.weightUnit,
      reps: input.reps,
      rest_pause_reps: input.restPauseReps ?? null,
      drop_weight: input.dropWeight ?? null,
      drop_reps: input.dropReps ?? null,
      rir_perceived: input.rirPerceived,
      is_pr: false,
      completed: true,
    }

    // 2. Encola la operación
    enqueue({
      type: 'create_set',
      payload: payload,
    })

    // 3. Si hay conexión, intenta sincronizar inmediatamente
    if (navigator.onLine) {
      await drainQueue()
    }

    const estimatedRM = calcRM(input.weight, input.reps)
    const currentPR = await recordsRepository.findBest(input.exerciseId, 'estimated_1rm')
    const isPR = input.setType === 'effective' && (!currentPR.data || estimatedRM > currentPR.data.value)

    if (isPR && navigator.onLine) {
      await recordsRepository.create({
        user_id: userId,
        exercise_id: input.exerciseId,
        record_type: 'estimated_1rm',
        value: estimatedRM,
        set_id: localId,
        achieved_at: new Date().toISOString().split('T')[0],
      })
    }
    // 4. Sin conexión — retorna con el ID local, sin PR (se recalcula al sincronizar)
    return {
      data: {
        set: { id: localId } as any,
        isPR,
        newRM: isPR ? estimatedRM : null,
      },
      error: null,
    }
  },

  async finishSession(sessionId: string, durationSeconds: number): Promise<Result<Session>> {
    if (navigator.onLine) await drainQueue()

    const { data, error } = await sessionsRepository.complete(sessionId, { duration_s: durationSeconds })

    const queue = getQueue()
    queue
      .filter(op => op.type === 'complete_session' && op.payload.id === sessionId)
      .forEach(op => removeFromQueue(op.opId))

    if (error) return { data: null, error }
    return { data, error: null }
  },

  async getActiveSession(userId: string): Promise<Result<Session | null>> {
    return sessionsRepository.findActive(userId)
  },

  async discardSession(sessionId: string): Promise<void> {
    const queue = getQueue()
    queue
      .filter(op =>
        (op.type === 'create_set' && op.payload.session_id === sessionId) ||
        (op.type === 'update_set' && op.payload.session_id === sessionId)
      )
      .forEach(op => removeFromQueue(op.opId))

    enqueue({ type: 'discard_session', payload: { id: sessionId } })
    if (navigator.onLine) await drainQueue()
  },

  async updateSet(
    setId: string,
    updates: {
      weight?: number
      reps?: number
      restPauseReps?: number
      dropWeight?: number
      dropReps?: number
      rirPerceived?: number
      technique?: string
    }
  ): Promise<Result<Set>> {
    return setsRepository.update(setId, updates)
  },

  async getExerciseHistory(exerciseId: string, userId: string, currentSessionId: string | null): Promise<Result<SetWithSession[]>> {
    return setsRepository.findLastByExercise(userId, exerciseId, currentSessionId)
  },

  async deleteSet(setId: string): Promise<Result<null>> {
    return setsRepository.delete(setId)
  },
}
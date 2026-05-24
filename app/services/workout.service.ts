// app/services/workout.service.ts
import { sessionsRepository } from '~/repositories/sessions.repository'
import { setsRepository } from '~/repositories/sets.repository'
import { recordsRepository } from '~/repositories/records.repository'
import { rmsRepository } from '~/repositories/rms.repository'
import { calcRM } from '~/core/utils/epley'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'
import type { SetType, WeightUnit } from '~/core/types/common.types'

type Session = Database['public']['Tables']['sessions']['Row']
type Set = Database['public']['Tables']['sets']['Row']

type LogSetInput = {
  exerciseId: string
  setNumber: number
  setType: SetType
  weight: number
  weightUnit: WeightUnit
  reps: number
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

  async logSet(
    sessionId: string,
    userId: string,
    input: LogSetInput
  ): Promise<Result<LogSetResult>> {
    // 1. Guardar la serie
    const setResult = await setsRepository.create({
      session_id: sessionId,
      exercise_id: input.exerciseId,
      set_number: input.setNumber,
      set_type: input.setType,
      weight: input.weight,
      weight_unit: input.weightUnit,
      reps: input.reps,
      rir_perceived: input.rirPerceived,
      is_pr: false,
      completed: true,
    })

    if (setResult.error) return { data: null, error: setResult.error }

    // 2. Solo verificar PRs en series efectivas
    if (input.setType !== 'effective') {
      return { data: { set: setResult.data, isPR: false, newRM: null }, error: null }
    }

    // 3. Calcular RM estimado de esta serie
    const estimatedRM = calcRM(input.weight, input.reps)

    // 4. Comparar con el mejor PR existente
    const currentPR = await recordsRepository.findBest(input.exerciseId, 'estimated_1rm')
    const isPR = !currentPR.data || estimatedRM > currentPR.data.value

    if (isPR) {
      // 5. Guardar nuevo PR
      await recordsRepository.create({
        user_id: userId,
        exercise_id: input.exerciseId,
        record_type: 'estimated_1rm',
        value: estimatedRM,
        set_id: setResult.data.id,
        achieved_at: new Date().toISOString().split('T')[0],
      })

      // 6. Marcar la serie como PR
      await setsRepository.update(setResult.data.id, { is_pr: true })

      // 7. Actualizar el RM del usuario
      await rmsRepository.upsert({
        user_id: userId,
        exercise_id: input.exerciseId,
        rm_kg: Math.round(estimatedRM * 10) / 10,
        tested_weight: input.weight,
        tested_reps: input.reps,
        tested_at: new Date().toISOString().split('T')[0],
      })
    }

    return {
      data: {
        set: setResult.data,
        isPR,
        newRM: isPR ? estimatedRM : null,
      },
      error: null,
    }
  },

  async finishSession(sessionId: string): Promise<Result<Session>> {
    return sessionsRepository.complete(sessionId)
  },

  async getActiveSession(userId: string): Promise<Result<Session | null>> {
    return sessionsRepository.findActive(userId)
  },
}
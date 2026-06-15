// app/services/progression.service.ts
//
// Servicio de progresión — delega al AITrainerService para lógica centralizada.
// Mantenido por compatibilidad con código existente.

import { rmsRepository } from '~/repositories/rms.repository'
import { aiProgramStatesRepository, BLOCK_PRESCRIPTIONS } from '~/repositories/ai-program-states.repository'
import { calcWorkingWeight } from '~/core/utils/epley'
import { calculateNextWeight } from '~/services/ai-trainer.service'
import type { Result } from '~/core/types/common.types'
import { AppServiceError } from '~/core/types/common.types'
import type { WeightUnit } from '~/services/ai-trainer.service'

type ExerciseRecommendation = {
  exerciseId: string
  targetWeightKg: number
  targetWeightLb: number
  displayWeight: string
  repRange: string
  rir: string
  setsCount: number
  intensityPct: number
  isDeload: boolean
  allowRestPause: boolean
  allowDropset: boolean
}

export const progressionService = {
  /**
   * Obtiene la recomendación completa para un ejercicio
   * usando el estado real del Motor IA del usuario.
   */
  async getRecommendation(
    userId: string,
    exerciseId: string,
    isCompound: boolean,
    unit: WeightUnit = 'kg'
  ): Promise<Result<ExerciseRecommendation>> {
    // 1. Obtener RM
    const rmResult = await rmsRepository.findByExercise(userId, exerciseId)
    if (rmResult.error) return { data: null, error: rmResult.error }

    const rm = rmResult.data?.rm_kg
    if (!rm) {
      return {
        data: null,
        error: new AppServiceError('No hay RM registrado para este ejercicio', 'NO_RM'),
      }
    }

    // 2. Obtener el estado del programa IA
    const stateRes = await aiProgramStatesRepository.findByUser(userId)
    const week = stateRes.data?.current_week ?? 1
    const block = BLOCK_PRESCRIPTIONS[week] ?? BLOCK_PRESCRIPTIONS[1]

    const intensityPct   = block.block_intensity_pct ?? 0.65
    const repMin         = block.block_rep_min ?? 10
    const repMax         = block.block_rep_max ?? 15
    const rirMin         = block.block_rir_min ?? 2
    const rirMax         = block.block_rir_max ?? 3
    const isDeload       = stateRes.data?.current_block === 'deload'
    const allowTech      = block.block_allow_techniques ?? false
    const setsCompound   = block.block_target_sets ?? 2
    const setsAccessory  = isDeload ? 1 : Math.max(1, setsCompound - 1)

    // 3. Calcular peso de trabajo
    const targetKg = calcWorkingWeight(rm, intensityPct, 'kg')
    const targetLb = calcWorkingWeight(rm * 2.2046, intensityPct, 'lb')
    const displayWeight = unit === 'kg' ? `${targetKg} kg` : `${targetLb} lb`

    return {
      data: {
        exerciseId,
        targetWeightKg: targetKg,
        targetWeightLb: targetLb,
        displayWeight,
        repRange: `${repMin}-${repMax}`,
        rir: `RIR ${rirMin}${rirMin !== rirMax ? `-${rirMax}` : ''}`,
        setsCount: isCompound ? setsCompound : setsAccessory,
        intensityPct,
        isDeload,
        allowRestPause: allowTech,
        allowDropset: allowTech,
      },
      error: null,
    }
  },

  /**
   * Determina si el usuario debe subir peso y cuánto.
   * Delega al AITrainerService para lógica de incremento kg/lb.
   */
  shouldProgressAndNextWeight(
    currentWeight: number,
    unit: WeightUnit,
    completedReps: number,
    targetRepsMax: number,
    rirAchieved: number,
    isDeload: boolean
  ) {
    return calculateNextWeight(currentWeight, unit, {
      completedReps,
      targetRepsMax,
      rirAchieved,
      isDeload,
    })
  },

  // Legacy helpers (mantenidos por compatibilidad)
  shouldProgress(rirPerceived: number): boolean {
    return rirPerceived >= 2
  },

  getNextWeight(currentWeight: number): number {
    return Math.round((currentWeight * 1.025) / 2.5) * 2.5
  },
}
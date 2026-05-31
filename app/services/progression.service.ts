// app/services/progression.service.ts
import { rmsRepository } from '~/repositories/rms.repository'
import { calcWorkingWeight } from '~/core/utils/epley'
import { getBlockConfig } from '~/core/utils/periodization'
import type { Result } from '~/core/types/common.types'
import { AppServiceError } from '~/core/types/common.types'

type ExerciseRecommendation = {
    exerciseId: string
    targetWeightKg: number
    repRange: string
    rir: string
    setsCount: number
    intensityPct: number
    isDeload: boolean
}

export const progressionService = {
    async getRecommendation(
        userId: string,
        exerciseId: string,
        week: number,
        isCompound: boolean
    ): Promise<Result<ExerciseRecommendation>> {
        // 1. Obtener RM del usuario para este ejercicio
        const rmResult = await rmsRepository.findByExercise(userId, exerciseId)
        if (rmResult.error) return { data: null, error: rmResult.error }

        const rm = rmResult.data?.rm_kg
        if (!rm) {
            return {
                data: null,
                // error: { message: 'No hay RM registrado para este ejercicio', details: '', hint: '', code: '' }
                error: new AppServiceError('No hay RM registrado para este ejercicio', 'NO_RM'),
            }
        }

        // 2. Obtener configuración del bloque actual
        const config = getBlockConfig(week)

        // 3. Calcular peso objetivo
        const targetWeight = calcWorkingWeight(rm, config.intensityPct)

        return {
            data: {
                exerciseId,
                targetWeightKg: targetWeight,
                repRange: config.repRange,
                rir: config.rir,
                setsCount: isCompound ? config.setsCompound : config.setsAccessory,
                intensityPct: config.intensityPct,
                isDeload: config.isDeload,
            },
            error: null,
        }
    },

    // Determina si el usuario debe subir peso la próxima semana
    shouldProgress(rirPerceived: number): boolean {
        return rirPerceived >= 2
    },

    getNextWeight(currentWeight: number): number {
        // Sube 2.5kg, redondeado al múltiplo de 2.5 más cercano
        return Math.round((currentWeight * 1.025) / 2.5) * 2.5
    },
}
// app/repositories/daily-checkins.repository.ts
import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type DailyCheckin = Database['public']['Tables']['daily_checkins']['Row']
type DailyCheckinInsert = Database['public']['Tables']['daily_checkins']['Insert']

export type MotorAction = 'normal' | 'reduced_volume' | 'technique_focus' | 'skip_advanced_techniques'

/** Calcula un score de recuperación (0-100) basado en el check-in */
export function calculateRecoveryScore(checkin: {
  sleep_hours: number
  stress_level: number
  muscle_soreness: number
}): number {
  // Sueño: 0-50 puntos (8h = máximo)
  const sleepScore = Math.min(50, (checkin.sleep_hours / 8) * 50)

  // Estrés: 0-25 puntos invertidos (1 = 25 pts, 5 = 0 pts)
  const stressScore = ((5 - checkin.stress_level) / 4) * 25

  // Dolor muscular: 0-25 puntos invertidos (1 = 25 pts, 5 = 0 pts)
  const sorenessScore = ((5 - checkin.muscle_soreness) / 4) * 25

  return Math.round(sleepScore + stressScore + sorenessScore)
}

/** Determina la acción del motor según el score de recuperación */
export function resolveMotorAction(recoveryScore: number): MotorAction {
  if (recoveryScore < 40) return 'technique_focus'
  if (recoveryScore < 55) return 'reduced_volume'
  if (recoveryScore < 70) return 'skip_advanced_techniques'
  return 'normal'
}

/** Calcula el multiplicador de volumen según la acción */
export function resolveVolumeMultiplier(action: MotorAction): number {
  const multipliers: Record<MotorAction, number> = {
    normal: 1.0,
    skip_advanced_techniques: 1.0,  // Volumen completo, solo sin RP/DS
    reduced_volume: 0.8,
    technique_focus: 0.5,
  }
  return multipliers[action]
}

export class DailyCheckinsRepository extends BaseRepository {
  /** Obtiene el check-in de hoy si existe */
  async findToday(userId: string): Promise<Result<DailyCheckin>> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
    return this.handle(data, error)
  }

  /** Crea el check-in del día con la decisión del motor calculada */
  async create(input: {
    userId: string
    sessionId?: string
    sleepHours: number
    stressLevel: number
    muscleSoreness: number
  }): Promise<Result<DailyCheckin>> {
    const recoveryScore = calculateRecoveryScore({
      sleep_hours: input.sleepHours,
      stress_level: input.stressLevel,
      muscle_soreness: input.muscleSoreness,
    })
    const motorAction = resolveMotorAction(recoveryScore)
    const volumeMultiplier = resolveVolumeMultiplier(motorAction)

    const checkin: DailyCheckinInsert = {
      user_id: input.userId,
      session_id: input.sessionId ?? null,
      sleep_hours: input.sleepHours,
      stress_level: input.stressLevel,
      muscle_soreness: input.muscleSoreness,
      motor_action: motorAction,
      volume_multiplier: volumeMultiplier,
    }

    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert(checkin, { onConflict: 'user_id,date' })
      .select()
      .single()
    return this.handle(data, error)
  }

  /** Obtiene los check-ins de la semana actual (para análisis semanal) */
  async getWeekCheckins(userId: string, daysBack = 7): Promise<Result<DailyCheckin[]>> {
    const from = new Date()
    from.setDate(from.getDate() - daysBack)
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('date', from.toISOString().split('T')[0])
      .order('date', { ascending: false })
    return this.handle(data, error)
  }
}

export const dailyCheckinsRepository = new DailyCheckinsRepository()

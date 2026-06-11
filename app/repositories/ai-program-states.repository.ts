// app/repositories/ai-program-states.repository.ts
import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database, Json } from '~/core/types/database.types'

type AIProgramState = Database['public']['Tables']['ai_program_states']['Row']
type AIProgramStateInsert = Database['public']['Tables']['ai_program_states']['Insert']
type AIProgramStateUpdate = Database['public']['Tables']['ai_program_states']['Update']

export type ProgramBlock =
  | 'rm_testing'
  | 'accumulation'
  | 'intensification'
  | 'realization'
  | 'deload'
  | 'transition'

export type DeficiencyReport = {
  primaryMuscle: string
  type: 'synergist_bottleneck' | 'recovery_or_volume_issue' | 'adaptation_plateau'
  suspectedWeak?: string[]
  action: string
  detectedWeek: number
  avg_sleep_this_week?: number
  recovery_factor?: 'low' | 'moderate' | 'good'
}

// Tabla maestra de los 16 bloques semanales
export const BLOCK_PRESCRIPTIONS: Record<number, Omit<AIProgramStateInsert,
  'user_id' | 'id' | 'created_at' | 'updated_at' | 'detected_deficiencies' |
  'applied_corrections' | 'last_analysis_week' | 'mesocycle_start_date' |
  'rm_test_sessions_done' | 'is_active'>> = {
  0:  { current_week: 0,  current_block: 'rm_testing',       block_target_sets: 1, block_intensity_pct: 0,    block_rep_min: 6,  block_rep_max: 12, block_rir_min: 1, block_rir_max: 2, block_allow_techniques: false },
  1:  { current_week: 1,  current_block: 'accumulation',     block_target_sets: 2, block_intensity_pct: 0.65, block_rep_min: 12, block_rep_max: 15, block_rir_min: 2, block_rir_max: 3, block_allow_techniques: true  },
  2:  { current_week: 2,  current_block: 'accumulation',     block_target_sets: 2, block_intensity_pct: 0.65, block_rep_min: 12, block_rep_max: 15, block_rir_min: 2, block_rir_max: 3, block_allow_techniques: true  },
  3:  { current_week: 3,  current_block: 'accumulation',     block_target_sets: 3, block_intensity_pct: 0.68, block_rep_min: 10, block_rep_max: 12, block_rir_min: 2, block_rir_max: 2, block_allow_techniques: true  },
  4:  { current_week: 4,  current_block: 'deload',           block_target_sets: 1, block_intensity_pct: 0.65, block_rep_min: 12, block_rep_max: 15, block_rir_min: 3, block_rir_max: 4, block_allow_techniques: false },
  5:  { current_week: 5,  current_block: 'intensification',  block_target_sets: 2, block_intensity_pct: 0.78, block_rep_min: 8,  block_rep_max: 10, block_rir_min: 1, block_rir_max: 2, block_allow_techniques: true  },
  6:  { current_week: 6,  current_block: 'intensification',  block_target_sets: 2, block_intensity_pct: 0.78, block_rep_min: 8,  block_rep_max: 10, block_rir_min: 1, block_rir_max: 2, block_allow_techniques: true  },
  7:  { current_week: 7,  current_block: 'intensification',  block_target_sets: 2, block_intensity_pct: 0.82, block_rep_min: 6,  block_rep_max: 8,  block_rir_min: 1, block_rir_max: 1, block_allow_techniques: true  },
  8:  { current_week: 8,  current_block: 'deload',           block_target_sets: 1, block_intensity_pct: 0.75, block_rep_min: 8,  block_rep_max: 10, block_rir_min: 3, block_rir_max: 4, block_allow_techniques: false },
  9:  { current_week: 9,  current_block: 'realization',      block_target_sets: 1, block_intensity_pct: 0.85, block_rep_min: 6,  block_rep_max: 8,  block_rir_min: 0, block_rir_max: 1, block_allow_techniques: true  },
  10: { current_week: 10, current_block: 'realization',      block_target_sets: 1, block_intensity_pct: 0.85, block_rep_min: 6,  block_rep_max: 8,  block_rir_min: 0, block_rir_max: 1, block_allow_techniques: true  },
  11: { current_week: 11, current_block: 'realization',      block_target_sets: 1, block_intensity_pct: 0.88, block_rep_min: 5,  block_rep_max: 8,  block_rir_min: 0, block_rir_max: 0, block_allow_techniques: true  },
  12: { current_week: 12, current_block: 'deload',           block_target_sets: 1, block_intensity_pct: 0.60, block_rep_min: 10, block_rep_max: 12, block_rir_min: 4, block_rir_max: 5, block_allow_techniques: false },
  13: { current_week: 13, current_block: 'transition',       block_target_sets: 1, block_intensity_pct: 0.85, block_rep_min: 6,  block_rep_max: 10, block_rir_min: 0, block_rir_max: 1, block_allow_techniques: false },
  14: { current_week: 14, current_block: 'transition',       block_target_sets: 2, block_intensity_pct: 0.65, block_rep_min: 12, block_rep_max: 15, block_rir_min: 2, block_rir_max: 3, block_allow_techniques: false },
  15: { current_week: 15, current_block: 'transition',       block_target_sets: 2, block_intensity_pct: 0.65, block_rep_min: 12, block_rep_max: 15, block_rir_min: 2, block_rir_max: 2, block_allow_techniques: false },
  16: { current_week: 16, current_block: 'deload',           block_target_sets: 1, block_intensity_pct: 0.65, block_rep_min: 12, block_rep_max: 15, block_rir_min: 3, block_rir_max: 4, block_allow_techniques: false },
}

export class AIProgramStatesRepository extends BaseRepository {
  /** Obtiene el estado activo del programa para el usuario */
  async findByUser(userId: string): Promise<Result<AIProgramState>> {
    const { data, error } = await supabase
      .from('ai_program_states')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
    return this.handle(data, error)
  }

  /** Inicializa el estado del programa al comenzar Semana 0 (fase de test) */
  async initialize(userId: string): Promise<Result<AIProgramState>> {
    const weekZero = BLOCK_PRESCRIPTIONS[0]
    const { data, error } = await supabase
      .from('ai_program_states')
      .upsert(
        {
          user_id: userId,
          ...weekZero,
          mesocycle_start_date: new Date().toISOString().split('T')[0],
          rm_test_sessions_done: 0,
          is_active: true,
          last_analysis_week: 0,
          detected_deficiencies: [],
          applied_corrections: [],
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
    return this.handle(data, error)
  }

  /** Avanza una sesión de test de RMs completada (0 → 1 → 2) */
  async completRMTestSession(userId: string, sessionsDone: 1 | 2): Promise<Result<AIProgramState>> {
    const updates: AIProgramStateUpdate = { rm_test_sessions_done: sessionsDone }
    // Si completó las 2 sesiones → avanza a Semana 1, Bloque Acumulación
    if (sessionsDone === 2) {
      Object.assign(updates, BLOCK_PRESCRIPTIONS[1])
    }
    const { data, error } = await supabase
      .from('ai_program_states')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    return this.handle(data, error)
  }

  /** Avanza al siguiente bloque semanal (llamado cada lunes de entrenamiento) */
  async advanceWeek(userId: string, currentWeek: number): Promise<Result<AIProgramState>> {
    const nextWeek = Math.min(currentWeek + 1, 16)
    const prescription = BLOCK_PRESCRIPTIONS[nextWeek]
    const { data, error } = await supabase
      .from('ai_program_states')
      .update(prescription)
      .eq('user_id', userId)
      .select()
      .single()
    return this.handle(data, error)
  }

  /** Agrega diagnósticos de deficiencias al log acumulativo */
  async appendDeficiencies(userId: string, reports: DeficiencyReport[]): Promise<Result<AIProgramState>> {
    // Fetch current deficiencies first to append (not overwrite)
    const current = await this.findByUser(userId)
    const existing = (current.data?.detected_deficiencies as DeficiencyReport[] | null) ?? []
    const merged: Json = [...existing, ...reports]

    const { data, error } = await supabase
      .from('ai_program_states')
      .update({
        detected_deficiencies: merged,
        last_analysis_week: reports[0]?.detectedWeek ?? 0,
      })
      .eq('user_id', userId)
      .select()
      .single()
    return this.handle(data, error)
  }
}

export const aiProgramStatesRepository = new AIProgramStatesRepository()

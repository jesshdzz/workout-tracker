// app/repositories/post-session-feedback.repository.ts
import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type PostSessionFeedback = Database['public']['Tables']['post_session_feedback']['Row']
type PostSessionFeedbackInsert = Database['public']['Tables']['post_session_feedback']['Insert']
type PostSessionFeedbackUpdate = Database['public']['Tables']['post_session_feedback']['Update']

export type PerceivedDifficulty = 'too_easy' | 'perfect' | 'hard_but_doable' | 'too_much'
export type PerceivedProgress = 'clearly_progressing' | 'maintaining' | 'stalled' | 'regressing'

export class PostSessionFeedbackRepository extends BaseRepository {
  /** Obtiene el feedback de una sesión específica */
  async findBySession(sessionId: string): Promise<Result<PostSessionFeedback>> {
    const { data, error } = await supabase
      .from('post_session_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()
    return this.handle(data, error)
  }

  /** Crea o actualiza el feedback de una sesión (upsert por session_id) */
  async upsert(feedback: PostSessionFeedbackInsert): Promise<Result<PostSessionFeedback>> {
    const { data, error } = await supabase
      .from('post_session_feedback')
      .upsert(feedback, { onConflict: 'session_id' })
      .select()
      .single()
    return this.handle(data, error)
  }

  /** Registra el cardio completado post-entreno */
  async recordCardio(sessionId: string, cardio: {
    completed: boolean
    duration_min?: number
    speed_kmh?: number
    incline_pct?: number
  }): Promise<Result<PostSessionFeedback>> {
    const updates: PostSessionFeedbackUpdate = {
      cardio_completed: cardio.completed,
      cardio_duration_min: cardio.duration_min ?? null,
      cardio_speed_kmh: cardio.speed_kmh ?? null,
      cardio_incline_pct: cardio.incline_pct ?? null,
    }
    const { data, error } = await supabase
      .from('post_session_feedback')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single()
    return this.handle(data, error)
  }

  /**
   * Obtiene el historial reciente de feedback para el análisis semanal del motor.
   * Usado por AITrainerService para detectar patrones de fatiga o estancamiento.
   */
  async getRecentForUser(userId: string, limit = 8): Promise<Result<PostSessionFeedback[]>> {
    const { data, error } = await supabase
      .from('post_session_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return this.handle(data, error)
  }

  /**
   * Cuenta cuántas sesiones seguidas el usuario reportó 'too_much' o 'too_easy'.
   * Si es ≥ 2 → el motor ajusta el bloque.
   */
  async countConsecutiveDifficulty(
    userId: string,
    difficulty: PerceivedDifficulty
  ): Promise<number> {
    const result = await this.getRecentForUser(userId, 4)
    if (!result.data) return 0
    let count = 0
    for (const f of result.data) {
      if (f.perceived_difficulty === difficulty) count++
      else break  // Requiere que sean consecutivas
    }
    return count
  }
}

export const postSessionFeedbackRepository = new PostSessionFeedbackRepository()

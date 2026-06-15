// app/features/training/hooks/useSessionLoop.ts
//
// Gestiona el flujo completo de una sesión:
//   1. Check-in pre-entreno (pre-flight)
//   2. Sesión activa
//   3. Feedback + cardio post-entreno
//
// Almacena el check-in y el feedback en Supabase después de que el
// usuario guarda la sesión (respetando la arquitectura local-first).

import { useState, useCallback } from 'react'
import { useAuth } from '~/features/auth/AuthProvider'
import { dailyCheckinsRepository } from '~/repositories/daily-checkins.repository'
import { postSessionFeedbackRepository } from '~/repositories/post-session-feedback.repository'
import type { CheckinInput } from '~/services/ai-trainer.service'
import type { FeedbackPayload } from '../components/PostSessionFeedbackModal'

export type SessionLoopState =
  | 'idle'          // Sin sesión activa
  | 'preflight'     // Mostrando check-in pre-entreno
  | 'active'        // Sesión en curso
  | 'postfeedback'  // Mostrando formulario de feedback post-sesión

export function useSessionLoop() {
  const { user } = useAuth()
  const [loopState, setLoopState] = useState<SessionLoopState>('idle')
  const [checkin, setCheckin] = useState<CheckinInput | null>(null)
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null)

  /** Inicia el flujo — muestra el check-in antes de iniciar la sesión */
  const requestStart = useCallback(() => {
    setLoopState('preflight')
  }, [])

  /** El usuario completó el check-in → guardar y continuar */
  const submitCheckin = useCallback(async (input: CheckinInput, sessionId?: string) => {
    setCheckin(input)

    if (user) {
      // Guardar en Supabase (upsert por user_id + date)
      await dailyCheckinsRepository.create({
        userId: user.id,
        sessionId,
        sleepHours: input.sleep_hours,
        stressLevel: input.stress_level,
        muscleSoreness: input.muscle_soreness,
      })
    }

    setLoopState('active')
  }, [user])

  /** El usuario saltó el check-in */
  const skipCheckin = useCallback(() => {
    setCheckin(null)
    setLoopState('active')
  }, [])

  /** La sesión terminó → mostrar feedback */
  const requestFeedback = useCallback((sessionId: string) => {
    setSavedSessionId(sessionId)
    setLoopState('postfeedback')
  }, [])

  /** El usuario completó el feedback post-sesión */
  const submitFeedback = useCallback(async (payload: FeedbackPayload) => {
    if (!user) return

    await postSessionFeedbackRepository.upsert({
      session_id: payload.sessionId,
      user_id: user.id,
      rpe_global: payload.rpeGlobal,
      perceived_difficulty: payload.perceivedDifficulty,
      perceived_progress: payload.perceivedProgress,
      excessive_fatigue_flag: payload.excessiveFatigueFlag,
      notes: payload.notes || null,
      cardio_completed: payload.cardioCompleted,
      cardio_duration_min: payload.cardioDurationMin,
      cardio_speed_kmh: payload.cardioSpeedKmh,
      cardio_incline_pct: payload.cardioInclinePct,
    })

    setLoopState('idle')
    setSavedSessionId(null)
  }, [user])

  /** El usuario saltó el feedback */
  const skipFeedback = useCallback(() => {
    setLoopState('idle')
    setSavedSessionId(null)
  }, [])

  /** Resetea el loop (ej: sesión descartada) */
  const resetLoop = useCallback(() => {
    setLoopState('idle')
    setCheckin(null)
    setSavedSessionId(null)
  }, [])

  return {
    loopState,
    checkin,
    savedSessionId,
    requestStart,
    submitCheckin,
    skipCheckin,
    requestFeedback,
    submitFeedback,
    skipFeedback,
    resetLoop,
  }
}

// app/features/training/hooks/useAITrainer.ts
//
// Hook React que conecta el AITrainerService con la UI.
// Carga el estado del programa, las métricas del usuario y genera
// la prescripción de la sesión del día.

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '~/features/auth/AuthProvider'
import {
  generateSessionPrescription,
  analyzeFeedbackPattern,
  runWeeklyDeficiencyAnalysis,
  type SessionPrescription,
  type ExerciseInput,
  type CheckinInput,
  type FeedbackAnalysis,
} from '~/services/ai-trainer.service'
import { aiProgramStatesRepository } from '~/repositories/ai-program-states.repository'
import { userMetricsRepository } from '~/repositories/user-metrics.repository'
import { dailyCheckinsRepository } from '~/repositories/daily-checkins.repository'
import { postSessionFeedbackRepository } from '~/repositories/post-session-feedback.repository'
import { rmsRepository } from '~/repositories/rms.repository'
import type { Database } from '~/core/types/database.types'

type AIProgramState = Database['public']['Tables']['ai_program_states']['Row']
type UserMetrics    = Database['public']['Tables']['user_metrics']['Row']

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de sinergistas para el análisis de deficiencias
// (músculo → qué otros músculos suelen ser el cuello de botella)
// ─────────────────────────────────────────────────────────────────────────────
const MUSCLE_SYNERGISTS: Record<string, { synergists: string[] }> = {
  lats:            { synergists: ['biceps', 'forearms', 'rear_deltoid'] },
  upper_chest:     { synergists: ['front_deltoid', 'triceps'] },
  lower_chest:     { synergists: ['triceps', 'front_deltoid'] },
  quads:           { synergists: ['glutes', 'hamstrings'] },
  hamstrings:      { synergists: ['glutes', 'forearms'] },
  front_deltoid:   { synergists: ['triceps'] },
  lateral_deltoid: { synergists: [] },
  rear_deltoid:    { synergists: ['traps', 'biceps'] },
  biceps:          { synergists: ['forearms'] },
  triceps:         { synergists: [] },
  calves:          { synergists: [] },
  glutes:          { synergists: ['hamstrings'] },
  abs:             { synergists: [] },
  traps:           { synergists: [] },
  forearms:        { synergists: [] },
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────

export type AITrainerState = {
  // Estado del motor
  programState: AIProgramState | null
  userMetrics: UserMetrics | null
  prescription: SessionPrescription | null
  feedbackAnalysis: FeedbackAnalysis | null

  // Estado de carga
  loading: boolean
  error: string | null

  // Semana y bloque actuales (helpers rápidos)
  currentWeek: number
  currentBlock: string
  blockLabel: string
  isDeload: boolean
  isRMTestPhase: boolean
  programInitialized: boolean

  // Alertas del análisis semanal
  weeklyAlerts: string[]

  // Acciones
  generatePrescription: (exercises: ExerciseInput[], checkin: CheckinInput | null) => void
  advanceWeek: () => Promise<void>
  completeRMTestSession: (sessionsDone: 1 | 2) => Promise<void>
  refresh: () => Promise<void>
}

const BLOCK_LABELS: Record<string, string> = {
  rm_testing:       'Semana 0 — Test de RMs',
  accumulation:     'Bloque 1 — Acumulación',
  intensification:  'Bloque 2 — Intensificación',
  realization:      'Bloque 3 — Realización',
  deload:           'Semana de Deload ⚡',
  transition:       'Bloque 4 — Transición',
}

export function useAITrainer(): AITrainerState {
  const { user } = useAuth()

  const [programState, setProgramState] = useState<AIProgramState | null>(null)
  const [userMetrics, setUserMetrics]   = useState<UserMetrics | null>(null)
  const [prescription, setPrescription] = useState<SessionPrescription | null>(null)
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<FeedbackAnalysis | null>(null)
  const [weeklyAlerts, setWeeklyAlerts] = useState<string[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // ── Carga inicial
  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const [stateRes, metricsRes] = await Promise.all([
      aiProgramStatesRepository.findByUser(user.id),
      userMetricsRepository.findByUser(user.id),
    ])

    if (stateRes.data) setProgramState(stateRes.data)
    if (metricsRes.data) setUserMetrics(metricsRes.data)

    // ── Análisis semanal automático silencioso
    if (stateRes.data && metricsRes.data) {
      await runWeeklyAnalysis(stateRes.data)
    }

    // ── Análisis de feedback reciente
    const feedbackRes = await postSessionFeedbackRepository.getRecentForUser(user.id, 6)
    if (feedbackRes.data) {
      setFeedbackAnalysis(analyzeFeedbackPattern(feedbackRes.data))
    }

    setLoading(false)
  }, [user])

  // ── Job semanal silencioso de deficiencias
  const runWeeklyAnalysis = useCallback(async (state: AIProgramState) => {
    if (!user) return
    const currentWeek = state.current_week ?? 1
    const lastAnalysis = state.last_analysis_week ?? 0

    // Solo correr si estamos en una semana nueva (no en deload ni en Semana 0)
    if (currentWeek <= 1 || currentWeek === lastAnalysis || state.current_block === 'rm_testing') return

    const [checkinsRes] = await Promise.all([
      dailyCheckinsRepository.getWeekCheckins(user.id, 7),
    ])

    // Por ahora el historial de progreso viene del análisis local.
    // En Fase F esto se enriquecerá con datos reales de sets completados.
    const analysis = runWeeklyDeficiencyAnalysis(
      [],   // progressHistory — se implementa en Fase F
      checkinsRes.data ?? [],
      currentWeek,
      MUSCLE_SYNERGISTS
    )

    if (analysis.deficiencies.length > 0) {
      await aiProgramStatesRepository.appendDeficiencies(user.id, analysis.deficiencies)
    }

    if (analysis.alerts.length > 0) {
      setWeeklyAlerts(analysis.alerts)
    }
  }, [user])

  // ── Genera la prescripción de sesión del día
  const generatePrescription = useCallback(
    (exercises: ExerciseInput[], checkin: CheckinInput | null) => {
      if (!programState || !userMetrics) {
        setError('El motor no está inicializado. Completa tu perfil de atleta primero.')
        return
      }
      const p = generateSessionPrescription(programState, exercises, userMetrics, checkin)
      setPrescription(p)
    },
    [programState, userMetrics]
  )

  // ── Avanza una semana (llamado al completar la primera sesión de la semana)
  const advanceWeek = useCallback(async () => {
    if (!user || !programState) return
    const current = programState.current_week ?? 0
    if (current >= 16) return

    const res = await aiProgramStatesRepository.advanceWeek(user.id, current)
    if (res.data) setProgramState(res.data)
  }, [user, programState])

  // ── Completa una sesión de test de RM (Semana 0)
  const completeRMTestSession = useCallback(async (sessionsDone: 1 | 2) => {
    if (!user) return
    const res = await aiProgramStatesRepository.completRMTestSession(user.id, sessionsDone)
    if (res.data) setProgramState(res.data)
  }, [user])

  const block       = programState?.current_block ?? 'rm_testing'
  const currentWeek = programState?.current_week ?? 0

  return {
    programState,
    userMetrics,
    prescription,
    feedbackAnalysis,
    loading,
    error,
    currentWeek,
    currentBlock: block,
    blockLabel: BLOCK_LABELS[block] ?? block,
    isDeload: block === 'deload',
    isRMTestPhase: block === 'rm_testing' || currentWeek === 0,
    programInitialized: !!programState,
    weeklyAlerts,
    generatePrescription,
    advanceWeek,
    completeRMTestSession,
    refresh: load,
  }
}

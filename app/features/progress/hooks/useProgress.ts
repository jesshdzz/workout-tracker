import { useEffect, useState } from 'react'
import { supabase } from '~/lib/supabase'
import { useAuth } from '~/features/auth/AuthProvider'
import { recordsRepository } from '~/repositories/records.repository'
import { sessionsRepository } from '~/repositories/sessions.repository'
import { setsRepository } from '~/repositories/sets.repository'

export type ExercisePR = {
  exerciseId: string
  exerciseName: string
  rmKg: number
  achievedAt: string
}

export type ProgressPoint = {
  date: string
  rm: number
}

export type ExerciseProgressData = {
  exerciseId: string
  exerciseName: string
  points: ProgressPoint[]
  currentRM: number
  firstRM: number
}

export type SessionStat = {
  id: string
  name: string | null
  date: string
  completed: boolean
  totalSets: number
  duration: number | null
}

type ProgressData = {
  prs: ExercisePR[]
  exerciseProgress: ExerciseProgressData[]
  recentSessions: SessionStat[]
  totalSessions: number
  totalPRs: number
  loading: boolean
  error: string | null
}

export function useProgress(): ProgressData {
  const { user } = useAuth()
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState<string | null>(null)
  const [prs, setPRs]                           = useState<ExercisePR[]>([])
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgressData[]>([])
  const [recentSessions, setRecentSessions]     = useState<SessionStat[]>([])
  const [totalSessions, setTotalSessions]       = useState(0)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [prsRes, sessionsRes, progressRes] = await Promise.all([
        // Mejor PR por ejercicio
        recordsRepository.findByUser(user!.id, 'estimated_1rm', 'value', false),

        // Sesiones recientes
        sessionsRepository.findCompletedRecentByUser(user!.id, 10),

        // Progresión de RM por ejercicio a lo largo del tiempo
        recordsRepository.findByUser(user!.id, 'estimated_1rm', 'achieved_at', true),
      ])

      if (prsRes.error) throw prsRes.error
      if (sessionsRes.error) throw sessionsRes.error

      // PRs — uno por ejercicio (el mejor)
      const bestByExercise = new Map<string, ExercisePR>()
      for (const pr of prsRes.data ?? []) {
        const ex = pr.exercises as any
        const existing = bestByExercise.get(pr.exercise_id)
        if (!existing || pr.value > existing.rmKg) {
          bestByExercise.set(pr.exercise_id, {
            exerciseId:   pr.exercise_id,
            exerciseName: ex?.name_es ?? ex?.name ?? 'Ejercicio',
            rmKg:         pr.value,
            achievedAt:   pr.achieved_at,
          })
        }
      }
      setPRs(Array.from(bestByExercise.values()))

      // Sesiones con conteo de sets
      const sessionIds = (sessionsRes.data ?? []).map(s => s.id)
      let setsCountMap = new Map<string | null, number>()

      if (sessionIds.length > 0) {
        const setsRes = await setsRepository.setsCountBySessionIds(sessionIds)

        for (const s of setsRes.data ?? []) {
          setsCountMap.set(s.session_id, (setsCountMap.get(s.session_id) ?? 0) + 1)
        }
      }

      setRecentSessions(
        (sessionsRes.data ?? []).map(s => ({
          id:        s.id,
          name:      s.name,
          date:      s.date,
          completed: s.completed ?? false,
          totalSets: setsCountMap.get(s.id) ?? 0,
          duration:  s.duration_s,
        }))
      )
      setTotalSessions(sessionsRes.data?.length ?? 0)

      // Progresión por ejercicio
      const byExercise = new Map<string, ExerciseProgressData>()
      for (const pr of progressRes.data ?? []) {
        const ex = pr.exercises as any
        const name = ex?.name_es ?? ex?.name ?? 'Ejercicio'
        const existing = byExercise.get(pr.exercise_id)
        if (existing) {
          existing.points.push({ date: pr.achieved_at, rm: pr.value })
          existing.currentRM = pr.value
        } else {
          byExercise.set(pr.exercise_id, {
            exerciseId:   pr.exercise_id,
            exerciseName: name,
            points:       [{ date: pr.achieved_at, rm: pr.value }],
            currentRM:    pr.value,
            firstRM:      pr.value,
          })
        }
      }
      setExerciseProgress(
        Array.from(byExercise.values()).filter(ex => ex.points.length >= 2)
      )
    } catch (e) {
      setError('Error al cargar el progreso')
    } finally {
      setLoading(false)
    }
  }

  return {
    prs,
    exerciseProgress,
    recentSessions,
    totalSessions,
    totalPRs: prs.length,
    loading,
    error,
  }
}
import { useEffect, useState } from 'react'
import { sessionsRepository } from '~/repositories/sessions.repository'
import { formatDuration } from '~/core/utils/formatters'
import type { Database } from '~/core/types/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type Set = Database['public']['Tables']['sets']['Row']

type SetWithExercise = Set & {
  exercises: {
    id: string
    name: string
    name_es: string | null
    slug: string
  } | null
}

type SessionWithSets = Session & {
  routines: { id: string; name: string } | null
  sets: SetWithExercise[]
}

type GroupedExercise = {
  exerciseId: string
  exerciseName: string
  sets: SetWithExercise[]
}

type SessionDetailData = {
  session: SessionWithSets | null
  groupedExercises: GroupedExercise[]
  totalEffectiveSets: number
  totalPRs: number
  durationLabel: string
  loading: boolean
  error: string | null
}

export function useSessionDetail(sessionId: string): SessionDetailData {
  const [session, setSession] = useState<SessionWithSets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      const result = await sessionsRepository.findWithSets(sessionId)

      if (result.error || !result.data) {
        setError('No se pudo cargar la sesión')
        setLoading(false)
        return
      }

      setSession(result.data as SessionWithSets)
      setLoading(false)
    }

    load()
  }, [sessionId])

  // Agrupar sets por ejercicio
  const groupedExercises: GroupedExercise[] = session
    ? Object.values(
        (session.sets as SetWithExercise[]).reduce<Record<string, GroupedExercise>>(
          (acc, set) => {
            const key = set.exercise_id
            if (!acc[key]) {
              acc[key] = {
                exerciseId: key,
                exerciseName: set.exercises?.name_es ?? set.exercises?.name ?? 'Ejercicio',
                sets: [],
              }
            }
            acc[key].sets.push(set)
            return acc
          },
          {}
        )
      )
    : []

  const effectiveSets = session?.sets.filter((s) => s.set_type === 'effective') ?? []
  const totalPRs = session?.sets.filter((s) => s.is_pr).length ?? 0
  const durationLabel = session?.duration_s
    ? formatDuration(session.duration_s)
    : '—'

  return {
    session,
    groupedExercises,
    totalEffectiveSets: effectiveSets.length,
    totalPRs,
    durationLabel,
    loading,
    error,
  }
}
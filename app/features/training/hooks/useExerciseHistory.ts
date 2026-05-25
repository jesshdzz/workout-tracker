import { useState, useEffect } from 'react'
import { useAuth } from '~/features/auth/AuthProvider'
import { workoutService } from '~/services/workout.service'

export type HistorySet = {
    setNumber: number
    setType: string
    technique: string
    weight: number
    weightUnit: string
    reps: number
    restPauseReps: number | null
    dropWeight: number | null
    dropReps: number | null
    isPR: boolean
}

export type ExerciseHistory = {
    sessionName: string | null
    sessionDate: string
    sets: HistorySet[]
}

export function useExerciseHistory(exerciseId: string, currentSessionId: string | null) {
    const { user } = useAuth()
    const [history, setHistory] = useState<ExerciseHistory | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || !exerciseId) return

        const load = async () => {
            setLoading(true)

            const { data, error } = await workoutService.getExerciseHistory(user.id, exerciseId, currentSessionId)

            if (error || !data || data.length === 0) {
                setHistory(null)
                setLoading(false)
                return
            }

            // Agrupar por sesión más reciente
            const firstSession = (data[0] as any).sessions
            const sessionSets = data.filter(
                (s: any) => s.sessions.id === firstSession.id
            )

            setHistory({
                sessionName: firstSession.name,
                sessionDate: firstSession.date,
                sets: sessionSets.map((s: any) => ({
                    setNumber: s.set_number,
                    setType: s.set_type,
                    technique: s.technique ?? 'normal',
                    weight: s.weight,
                    weightUnit: s.weight_unit,
                    reps: s.reps,
                    restPauseReps: s.rest_pause_reps,
                    dropWeight: s.drop_weight,
                    dropReps: s.drop_reps,
                    isPR: s.is_pr,
                })),
            })

            setLoading(false)
        }

        load()
    }, [user, exerciseId, currentSessionId])

    return { history, loading }
}
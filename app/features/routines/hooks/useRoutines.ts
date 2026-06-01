import { useState, useEffect } from 'react'
import { routinesRepository, type RoutineWithExercises } from '~/repositories/routines.repository'
import { useAuth } from '~/features/auth/AuthProvider'

export function useRoutines() {
    const { user } = useAuth()
    const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        load()
    }, [user])

    const load = async () => {
        setLoading(true)
        setError(null)
        const result = await routinesRepository.findByUser(user!.id)
        if (result.error) setError('Error al cargar las rutinas')
        else setRoutines(result.data ?? [])
        setLoading(false)
    }

    const rename = async (id: string, name: string) => {
        const result = await routinesRepository.rename(id, name)
        if (!result.error) {
            setRoutines(prev =>
                prev.map(r => r.id === id ? { ...r, name } : r)
            )
        }
        return result
    }

    const duplicate = async (id: string) => {
        if (!user) return
        const result = await routinesRepository.duplicate(id, user.id)
        if (!result.error && result.data) {
            setRoutines(prev => [result.data!, ...prev])
        }
        return result
    }

    const remove = async (id: string) => {
        const result = await routinesRepository.delete(id)
        if (!result.error) {
            setRoutines(prev => prev.filter(r => r.id !== id))
        }
        return result
    }

    return { routines, loading, error, reload: load, rename, duplicate, remove }
}
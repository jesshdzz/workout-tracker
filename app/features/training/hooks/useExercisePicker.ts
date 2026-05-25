import { useState, useMemo } from 'react'
import type { Database } from '~/core/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

type ExerciseWithMuscles = Exercise & {
    exercise_muscles: {
        role: string
        muscle_groups: {
            slug: string
            name_es: string
            body_region: string
        } | null
    }[]
}

export function useExercisePicker(
    exercises: ExerciseWithMuscles[],
    alreadyInSession: string[] // exerciseIds ya en sesión
) {
    const [search, setSearch] = useState('')
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
    const [selected, setSelected] = useState<Set<string>>(new Set())

    // Grupos musculares únicos para el filtro
    const muscleGroups = useMemo(() => {
        const seen = new Map<string, string>()
        exercises.forEach((ex) => {
            ex.exercise_muscles
                .filter((em) => em.role === 'primary' && em.muscle_groups)
                .forEach((em) => {
                    if (em.muscle_groups && !seen.has(em.muscle_groups.slug)) {
                        seen.set(em.muscle_groups.slug, em.muscle_groups.name_es)
                    }
                })
        })
        return Array.from(seen.entries()).map(([slug, name_es]) => ({ slug, name_es }))
    }, [exercises])

    // Ejercicios filtrados
    const filtered = useMemo(() => {
        return exercises.filter((ex) => {
            const matchesSearch = search.trim() === '' ||
                ex.name.toLowerCase().includes(search.toLowerCase()) ||
                (ex.name_es ?? '').toLowerCase().includes(search.toLowerCase())

            const matchesMuscle = !selectedMuscle ||
                ex.exercise_muscles.some(
                    (em) => em.role === 'primary' && em.muscle_groups?.slug === selectedMuscle
                )

            return matchesSearch && matchesMuscle
        })
    }, [exercises, search, selectedMuscle])

    const toggle = (exerciseId: string) => {
        if (alreadyInSession.includes(exerciseId)) return
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(exerciseId)) next.delete(exerciseId)
            else next.add(exerciseId)
            return next
        })
    }

    const clearSelection = () => setSelected(new Set())

    return {
        search, setSearch,
        selectedMuscle, setSelectedMuscle,
        muscleGroups,
        filtered,
        selected,
        toggle,
        clearSelection,
        selectedCount: selected.size,
    }
}
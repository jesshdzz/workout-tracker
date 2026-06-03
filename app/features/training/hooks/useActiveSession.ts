import { useEffect, useRef } from 'react'
import { useSessionStore, type ActiveSet } from '../store/session.store'
import { workoutService } from '~/services/workout.service'
import { useAuth } from '~/features/auth/AuthProvider'

export function useActiveSession() {
  const { user } = useAuth()
  const {
    sessionId,
    sets,
    elapsedSeconds,
    initSession,
    addSet,
    markPR,
    startRest,
    tickElapsed,
    reset,
  } = useSessionStore()

  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // const tickElapsed = useSessionStore((state) => state.tickElapsed)

  const startTimer = () => {
    if (elapsedRef.current) clearInterval(elapsedRef.current)
    elapsedRef.current = setInterval(tickElapsed, 1000)
  }

  const pauseTimer = () => {
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current)
      elapsedRef.current = null
    }
  }

  // Arranca automáticamente si hay sesión activa al montar
  useEffect(() => {
    if (!sessionId) return
    startTimer()
    return () => pauseTimer()
  }, [sessionId])

  const startSession = async (options?: {
    routineId?: string
    name?: string
    weekNumber?: number
    blockNumber?: number
  }) => {
    if (!user) return null

    const result = await workoutService.startSession(user.id, options)
    if (result.error || !result.data) return null

    initSession(
      result.data.id,
      result.data.name ?? options?.name ?? 'Sesión sin nombre',
      result.data.routine_id ?? options?.routineId,
      result.data.week_number,
      result.data.block_number
    )
    return result.data
  }

  const logSet = async (input: {
    exerciseId: string
    exerciseName: string
    setNumber: number
    setType: 'warmup' | 'effective'
    technique: 'normal' | 'rest_pause' | 'drop_set' | 'failure'  // ← añade
    weight: number
    weightUnit: 'kg' | 'lb'
    reps: number
    restPauseReps?: number    // ← añade
    dropWeight?: number       // ← añade
    dropReps?: number         // ← añade
    rirPerceived: number
    restAfterSeconds?: number
  }) => {
    if (!sessionId || !user) return null

    const result = await workoutService.logSet(sessionId, user.id, {
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      setType: input.setType,
      technique: input.technique,       // ← añade
      weight: input.weight,
      weightUnit: input.weightUnit,
      reps: input.reps,
      restPauseReps: input.restPauseReps,   // ← añade
      dropWeight: input.dropWeight,      // ← añade
      dropReps: input.dropReps,        // ← añade
      rirPerceived: input.rirPerceived,
    })

    if (result.error || !result.data) return null

    const newSet: ActiveSet = {
      id: result.data.set.id,    // ← viene del resultado de BD
      exerciseId: input.exerciseId,
      exerciseName: input.exerciseName,
      setNumber: input.setNumber,
      setType: input.setType,
      technique: input.technique,       // ← añade
      weight: input.weight,
      weightUnit: input.weightUnit,
      reps: input.reps,
      restPauseReps: input.restPauseReps,   // ← añade
      dropWeight: input.dropWeight,      // ← añade
      dropReps: input.dropReps,        // ← añade
      rirPerceived: input.rirPerceived,
      completed: true,
      isPR: result.data.isPR,
    }

    addSet(newSet)

    if (result.data.isPR) {
      markPR(input.setNumber, input.exerciseId)
    }

    // Iniciar descanso automáticamente
    if (input.restAfterSeconds) {
      startRest(input.restAfterSeconds)
    }

    return result.data
  }

  const finishSession = async () => {
    if (!sessionId) return
    pauseTimer()
    await workoutService.finishSession(sessionId, elapsedSeconds)
  }

  const setsForExercise = (exerciseId: string) =>
    sets.filter((s) => s.exerciseId === exerciseId)

  const discardSession = async () => {
    if (!sessionId) return
    pauseTimer()
    await workoutService.discardSession(sessionId)
  }

  const updateSetInStore = async (setId: string, updates: Partial<ActiveSet>) => {
    // Actualiza el store inmediatamente (optimistic update)
    useSessionStore.getState().updateSet(setId, updates)

    // Sincroniza con la BD
    await workoutService.updateSet(setId, {
      weight: updates.weight,
      reps: updates.reps,
      restPauseReps: updates.restPauseReps,
      dropWeight: updates.dropWeight,
      dropReps: updates.dropReps,
      rirPerceived: updates.rirPerceived,
      technique: updates.technique,
      setType: updates.setType,
    })
  }

  const deleteSetFromStore = async (setId: string) => {
    useSessionStore.getState().removeSet(setId)
    await workoutService.deleteSet(setId)
  }

  return {
    sessionId,
    sets,
    elapsedSeconds,
    startSession,
    logSet,
    pauseTimer,
    finishSession,
    discardSession,
    setsForExercise,
    updateSetInStore,
    deleteSetFromStore,
  }
}
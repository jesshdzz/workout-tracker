// app/features/training/hooks/useActiveSession.ts
import { useEffect, useRef } from 'react'
import { useSessionStore } from '../store/session.store'
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

  // Cronómetro de sesión
  useEffect(() => {
    elapsedRef.current = setInterval(() => tickElapsed(), 1000)
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current)
    }
  }, [tickElapsed])

  const startSession = async (options?: {
    routineId?: string
    name?: string
    weekNumber?: number
    blockNumber?: number
  }) => {
    if (!user) return null

    const result = await workoutService.startSession(user.id, options)
    if (result.error || !result.data) return null

    initSession(result.data.id)
    return result.data
  }

  const logSet = async (input: {
    exerciseId: string
    exerciseName: string
    setNumber: number
    setType: 'warmup' | 'effective'
    weight: number
    weightUnit: 'kg' | 'lb'
    reps: number
    rirPerceived: number
    restAfterSeconds?: number
  }) => {
    if (!sessionId || !user) return null

    const result = await workoutService.logSet(sessionId, user.id, {
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      setType: input.setType,
      weight: input.weight,
      weightUnit: input.weightUnit,
      reps: input.reps,
      rirPerceived: input.rirPerceived,
    })

    if (result.error || !result.data) return null

    const newSet = {
      exerciseId: input.exerciseId,
      exerciseName: input.exerciseName,
      setNumber: input.setNumber,
      setType: input.setType,
      weightKg: input.weight,
      weightUnit: input.weightUnit,
      reps: input.reps,
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
    await workoutService.finishSession(sessionId, elapsedSeconds)
    if (elapsedRef.current) clearInterval(elapsedRef.current)
  }

  const setsForExercise = (exerciseId: string) =>
    sets.filter((s) => s.exerciseId === exerciseId)

  return {
    sessionId,
    sets,
    elapsedSeconds,
    startSession,
    logSet,
    finishSession,
    setsForExercise,
  }
}
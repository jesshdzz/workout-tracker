import { useEffect, useRef } from 'react'
import { useSessionStore, type ActiveSet } from '../store/session.store'
import { workoutService } from '~/services/workout.service'
import { recordsRepository } from '~/repositories/records.repository'
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

  /**
   * Mapa de mejores 1RMs almacenados + intra-sesión para detectar PRs localmente.
   * Se usa useRef (no useState) porque las mutaciones no necesitan re-renders —
   * solo se consulta dentro de logSet (rerender-defer-reads de vercel-react-best-practices).
   */
  const localPRsMap = useRef<Map<string, number>>(new Map())

  // Cargar PRs del usuario al montar para comparación local durante el entreno (client-localstorage-schema)
  useEffect(() => {
    if (!user) return
    recordsRepository.findByUser(user.id).then(result => {
      if (result.data) {
        localPRsMap.current.clear()
        result.data.forEach(pr => localPRsMap.current.set(pr.exercise_id, pr.value))
      }
    })
  }, [user?.id])

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

  /**
   * Registra una serie en el store local SIN fetch a Supabase.
   * Calcula isPR comparando contra el mapa local (histórico + intra-sesión).
   * El flush real ocurre al llamar finishSession().
   */
  const logSet = (input: {
    exerciseId: string
    exerciseName: string
    setNumber: number
    setType: 'warmup' | 'effective'
    technique: 'normal' | 'rest_pause' | 'drop_set' | 'failure'
    weight: number
    weightUnit: 'kg' | 'lb'
    reps: number
    restPauseReps?: number
    dropWeight?: number
    dropReps?: number
    rirPerceived: number
    restAfterSeconds?: number
  }) => {
    if (!sessionId) return null

    // Sin fetch — calcula localmente y muta el mapa intra-sesión
    const { id, isPR } = workoutService.logSet(input, localPRsMap.current)

    const newSet: ActiveSet = {
      id,
      exerciseId: input.exerciseId,
      exerciseName: input.exerciseName,
      setNumber: input.setNumber,
      setType: input.setType,
      technique: input.technique,
      weight: input.weight,
      weightUnit: input.weightUnit,
      reps: input.reps,
      restPauseReps: input.restPauseReps,
      dropWeight: input.dropWeight,
      dropReps: input.dropReps,
      rirPerceived: input.rirPerceived,
      completed: true,
      isPR,
    }

    addSet(newSet)

    if (isPR) {
      markPR(input.setNumber, input.exerciseId)
    }

    if (input.restAfterSeconds) {
      startRest(input.restAfterSeconds)
    }

    return { id, isPR }
  }

  /**
   * Guarda la sesión en Supabase: bulk-insert de sets → PRs → completar.
   * Pasa todos los sets del store al servicio para el flush final.
   */
  const finishSession = async () => {
    if (!sessionId || !user) return null
    pauseTimer()
    return workoutService.finishSession(sessionId, elapsedSeconds, sets, user.id)
  }

  const setsForExercise = (exerciseId: string) =>
    sets.filter(s => s.exerciseId === exerciseId)

  /**
   * Descarta la sesión: elimina la fila en BD y retorna el resultado
   * para que el caller pueda decidir si limpiar el store o mostrar error.
   */
  const discardSession = async () => {
    if (!sessionId) return { data: null as null, error: null }
    pauseTimer()
    return workoutService.discardSession(sessionId)
  }

  /**
   * Actualiza una serie completada SOLO en el store local (sin fetch a Supabase).
   * El cambio se persistirá junto con el resto al llamar finishSession().
   */
  const updateSetInStore = (setId: string, updates: Partial<ActiveSet>) => {
    useSessionStore.getState().updateSet(setId, updates)
  }

  /**
   * Elimina una serie del store local SIN fetch a Supabase.
   * Como los sets nunca se escriben en BD durante la sesión, no hay FK que limpiar.
   */
  const deleteSetFromStore = (setId: string) => {
    useSessionStore.getState().removeSet(setId)
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
    reset,
  }
}
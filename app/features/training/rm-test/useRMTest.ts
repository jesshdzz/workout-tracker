// app/features/training/rm-test/useRMTest.ts
//
// Hook que gestiona el flujo completo del test de RMs.
// - Carga el estado del programa para saber cuántas sesiones se completaron
// - Para cada ejercicio, el usuario ingresa peso + reps → calcula RM con Epley
// - Al terminar la sesión: guarda RMs en personal_rms, avanza rm_test_sessions_done
// - Al terminar sesión 2: transiciona a Semana 1 (accumulation)

import { useState, useCallback } from 'react'
import { useAuth } from '~/features/auth/AuthProvider'
import { calcRM } from '~/core/utils/epley'
import { rmsRepository } from '~/repositories/rms.repository'
import { aiProgramStatesRepository } from '~/repositories/ai-program-states.repository'
import { exercisesRepository } from '~/repositories/exercises.repository'
import {
  RM_TEST_SESSION_1,
  RM_TEST_SESSION_2,
  type RMTestExercise,
  type RMTestSession,
} from './rm-test.catalog'
import type { Database } from '~/core/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

export type RMEntry = {
  slug: string
  nameEs: string
  exerciseId: string | null   // null si el slug no existe en BD
  repRangeMin: number
  repRangeMax: number
  isCompound: boolean
  safetyNote: string | null
  bodyweightOnly?: boolean
  // Valores ingresados por el usuario
  weightUsed: string        // El peso con el que hizo el test
  repsCompleted: string     // Reps completadas
  bodyweightKg?: string     // Para fondos — peso corporal del usuario
  // Calculado
  calculatedRM: number | null
  saved: boolean
}

export type RMTestPhase =
  | 'intro'           // Pantalla de introducción
  | 'session-1'       // Test Upper
  | 'between'         // Pantalla entre sesión 1 y 2 (descanso de 1 día)
  | 'session-2'       // Test Lower
  | 'summary'         // Resumen de RMs calculados y peso para Semana 1
  | 'done'            // Completado — ya en Semana 1

export function useRMTest() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<RMTestPhase>('intro')
  const [sessionIndex, setSessionIndex] = useState(0)   // índice del ejercicio actual dentro de la sesión
  const [session1Entries, setSession1Entries] = useState<RMEntry[]>([])
  const [session2Entries, setSession2Entries] = useState<RMEntry[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Precarga ejercicios de BD para cruzar slugs con IDs reales
  const loadExercises = useCallback(async () => {
    const res = await exercisesRepository.findAll()
    if (res.data) setAllExercises(res.data)
    return res.data ?? []
  }, [])

  // Convierte el catálogo a entradas con IDs de BD
  const buildEntries = useCallback((session: RMTestSession, exercises: Exercise[]): RMEntry[] => {
    return session.exercises.map(ex => {
      const found = exercises.find(e => e.slug === ex.slug)
      return {
        ...ex,
        exerciseId: found?.id ?? null,
        weightUsed: '',
        repsCompleted: '',
        bodyweightKg: '',
        calculatedRM: null,
        saved: false,
      }
    })
  }, [])

  // Arranca la Sesión 1
  const startSession1 = useCallback(async () => {
    const exercises = await loadExercises()
    setSession1Entries(buildEntries(RM_TEST_SESSION_1, exercises))
    setSessionIndex(0)
    setPhase('session-1')
  }, [loadExercises, buildEntries])

  // Arranca la Sesión 2
  const startSession2 = useCallback(async () => {
    if (allExercises.length === 0) {
      const exercises = await loadExercises()
      setSession2Entries(buildEntries(RM_TEST_SESSION_2, exercises))
    } else {
      setSession2Entries(buildEntries(RM_TEST_SESSION_2, allExercises))
    }
    setSessionIndex(0)
    setPhase('session-2')
  }, [allExercises, loadExercises, buildEntries])

  // Actualiza el campo de un ejercicio en la sesión activa
  const updateEntry = useCallback((
    sessionPhase: 'session-1' | 'session-2',
    index: number,
    field: 'weightUsed' | 'repsCompleted' | 'bodyweightKg',
    value: string
  ) => {
    const setter = sessionPhase === 'session-1' ? setSession1Entries : setSession2Entries
    setter(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }

      // Recalcular RM en tiempo real
      const entry = updated[index]
      const weight = entry.bodyweightOnly
        ? parseFloat(entry.bodyweightKg ?? '0')
        : parseFloat(entry.weightUsed)
      const reps = parseFloat(entry.repsCompleted)

      if (!isNaN(weight) && weight > 0 && !isNaN(reps) && reps > 0) {
        updated[index].calculatedRM = Math.round(calcRM(weight, reps) * 10) / 10
      } else {
        updated[index].calculatedRM = null
      }

      return updated
    })
  }, [])

  // Guarda todos los RMs de una sesión en Supabase
  const saveSessionRMs = useCallback(async (
    entries: RMEntry[],
    sessionDone: 1 | 2
  ): Promise<boolean> => {
    if (!user) return false
    setSaving(true)
    setError(null)

    const validEntries = entries.filter(e => e.exerciseId && e.calculatedRM && e.calculatedRM > 0)

    // Guardar en personal_rms (upsert por user_id + exercise_id)
    const results = await Promise.all(
      validEntries.map(e => {
        const weight = e.bodyweightOnly
          ? parseFloat(e.bodyweightKg ?? '0')
          : parseFloat(e.weightUsed)
        const reps = parseFloat(e.repsCompleted)
        return rmsRepository.upsert({
          user_id: user.id,
          exercise_id: e.exerciseId!,
          rm_kg: e.calculatedRM!,
          tested_at: new Date().toISOString().split('T')[0],
          tested_weight: isNaN(weight) ? null : weight,
          tested_reps: isNaN(reps) ? null : reps,
        })
      })
    )

    const hasError = results.some(r => r.error)
    if (hasError) {
      setError('Error al guardar algunos RMs. Por favor revisa e intenta de nuevo.')
      setSaving(false)
      return false
    }

    // Avanzar el contador de sesiones de test
    const advance = await aiProgramStatesRepository.completRMTestSession(user.id, sessionDone)
    if (advance.error) {
      setError('Error al actualizar el progreso del programa.')
      setSaving(false)
      return false
    }

    setSaving(false)
    return true
  }, [user])

  // Completa la sesión 1 y muestra pantalla "between"
  const finishSession1 = useCallback(async () => {
    const ok = await saveSessionRMs(session1Entries, 1)
    if (ok) setPhase('between')
  }, [session1Entries, saveSessionRMs])

  // Completa la sesión 2 y muestra resumen
  const finishSession2 = useCallback(async () => {
    const ok = await saveSessionRMs(session2Entries, 2)
    if (ok) setPhase('summary')
  }, [session2Entries, saveSessionRMs])

  // Marca el test como completado y pasa a la app normal
  const completeDone = useCallback(() => {
    setPhase('done')
  }, [])

  const allEntries = [...session1Entries, ...session2Entries]
  const validRMs = allEntries.filter(e => e.calculatedRM && e.calculatedRM > 0)

  return {
    phase,
    session1Entries,
    session2Entries,
    sessionIndex,
    saving,
    error,
    allEntries,
    validRMs,
    updateEntry,
    startSession1,
    startSession2,
    finishSession1,
    finishSession2,
    completeDone,
    setSessionIndex,
  }
}

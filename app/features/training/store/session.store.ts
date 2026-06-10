import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '~/core/types/database.types'
import type { WeightUnit } from '~/core/types/common.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

export type ActiveSet = {
  id: string
  exerciseId: string
  exerciseName: string
  setNumber: number
  setType: 'warmup' | 'effective'
  technique: 'normal' | 'rest_pause' | 'drop_set' | 'failure'
  weight: number
  weightUnit: 'kg' | 'lb'
  reps: number
  restPauseReps?: number                  // rest-pause
  dropWeight?: number                     // drop-set
  dropReps?: number                       // drop-set
  rirPerceived: number
  completed: boolean
  isPR: boolean
}

export type PendingSet = {
  weight: string
  reps: string
  technique: 'normal' | 'rest_pause' | 'drop_set' | 'failure'
  rir: number
  setType: 'warmup' | 'effective'
  restPauseReps?: string
  dropWeight?: string
  dropReps?: string
  restAfterSeconds?: number
}

export type SessionExercise = {
  exerciseId: string
  exerciseName: string
  order: number
  targetSets: number
  targetReps: string
  targetRir: number | null
  intensityPct: number | null
  warmupSets?: number
  technique?: string
  restAfterSeconds?: number
  notesText?: string        // Notas del ejercicio en la rutina (de routine_exercises.notes)
  sets?: {
    setType: 'warmup' | 'effective'
    reps: string
    technique: 'normal' | 'rest_pause' | 'drop_set' | 'failure'
    restAfterSeconds: number
  }[]
}


type SessionStore = {
  sessionId: string | null
  sessionName: string | null
  routineId: string | null
  weekNumber: number | null
  blockNumber: number | null
  currentExercise: Exercise | null
  sets: ActiveSet[]
  isResting: boolean
  restSeconds: number
  elapsedSeconds: number
  startedAt: number | null
  sessionExercises: SessionExercise[]
  pendingSets: Record<string, PendingSet[]>

  // Acciones
  initSession: (
    sessionId: string,
    name?: string | null,
    routineId?: string | null,
    weekNumber?: number | null,
    blockNumber?: number | null
  ) => void
  setCurrentExercise: (exercise: Exercise) => void
  addSet: (set: ActiveSet) => void
  markPR: (setNumber: number, exerciseId: string) => void
  startRest: (seconds: number) => void
  stopRest: () => void
  tickRest: () => void
  tickElapsed: () => void
  reset: () => void
  addExerciseToSession: (exercise: SessionExercise) => void
  removeExerciseFromSession: (exerciseId: string) => void
  reorderExercises: (from: number, to: number) => void
  updateSet: (id: string, updates: Partial<ActiveSet>) => void
  removeSet: (id: string) => void
  setPendingSets: (exerciseId: string, sets: PendingSet[]) => void
  updatePendingSet: (exerciseId: string, index: number, updates: Partial<PendingSet>) => void
  addPendingSetRow: (exerciseId: string, set: PendingSet) => void
  removePendingSetRow: (exerciseId: string, index: number) => void
}

const initialState = {
  sessionId: null,
  sessionName: null,
  routineId: null,
  weekNumber: null,
  blockNumber: null,
  currentExercise: null,
  sets: [],
  isResting: false,
  restSeconds: 0,
  elapsedSeconds: 0,
  startedAt: null,
  sessionExercises: [],
  pendingSets: {},
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      ...initialState,

      initSession: (sessionId, name, routineId, weekNumber, blockNumber) =>
        set({
          sessionId,
          sessionName: name,
          routineId: routineId ?? null,
          weekNumber: weekNumber ?? null,
          blockNumber: blockNumber ?? null,
          startedAt: Date.now(),
          elapsedSeconds: 0,
        }),

      setCurrentExercise: (exercise) => set({ currentExercise: exercise }),

      addSet: (newSet) =>
        set((state) => ({ sets: [...state.sets, newSet] })),

      markPR: (setNumber, exerciseId) =>
        set((state) => ({
          sets: state.sets.map((s) =>
            s.setNumber === setNumber && s.exerciseId === exerciseId
              ? { ...s, isPR: true }
              : s
          ),
        })),

      startRest: (seconds) => set({ isResting: true, restSeconds: seconds }),

      stopRest: () => set({ isResting: false, restSeconds: 0 }),

      tickRest: () =>
        set((state) => {
          if (state.restSeconds <= 1) return { isResting: false, restSeconds: 0 }
          return { restSeconds: state.restSeconds - 1 }
        }),

      tickElapsed: () =>
        set((state) => {
          if (!state.startedAt) return { elapsedSeconds: state.elapsedSeconds + 1 }
          return { elapsedSeconds: Math.floor((Date.now() - state.startedAt) / 1000) }
        }),

      reset: () => set(initialState),

      addExerciseToSession: (exercise) =>
        set((state) => {
          let initialPending: PendingSet[] = []

          if (exercise.sets && exercise.sets.length > 0) {
            initialPending = exercise.sets.map((s) => ({
              weight: '',
              reps: s.reps ?? '',
              technique: s.technique ?? 'normal',
              rir: 2,
              setType: s.setType,
              restAfterSeconds: s.restAfterSeconds ?? 90,
              restPauseReps: '',
              dropWeight: '',
              dropReps: '',
            }))
          } else {
            const warmupCount = exercise.warmupSets ?? 0
            const effCount = exercise.targetSets ?? 3
            const totalCount = warmupCount + effCount

            initialPending = Array.from({ length: totalCount }, (_, i) => ({
              weight: '',
              reps: '',
              technique: (exercise.technique as any) ?? 'normal',
              rir: 2,
              setType: i < warmupCount ? ('warmup' as const) : ('effective' as const),
              restAfterSeconds: exercise.restAfterSeconds ?? 90,
              restPauseReps: '',
              dropWeight: '',
              dropReps: '',
            }))
          }

          return {
            sessionExercises: [
              ...state.sessionExercises,
              { ...exercise, order: state.sessionExercises.length },
            ],
            pendingSets: {
              ...state.pendingSets,
              [exercise.exerciseId]: initialPending,
            },
          }
        }),

      reorderExercises: (from, to) =>
        set((state) => {
          const list = [...state.sessionExercises]
          const [moved] = list.splice(from, 1)
          list.splice(to, 0, moved)
          return {
            sessionExercises: list.map((ex, i) => ({ ...ex, order: i })),
          }
        }),
      updateSet: (id, updates) =>
        set((state) => ({
          sets: state.sets.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      removeSet: (id) =>
        set((state) => ({
          sets: state.sets.filter((s) => s.id !== id),
        })),

      removeExerciseFromSession: (exerciseId) =>
        set((state) => ({
          sessionExercises: state.sessionExercises
            .filter((ex) => ex.exerciseId !== exerciseId)
            .map((ex, i) => ({ ...ex, order: i })),
          sets: state.sets.filter((s) => s.exerciseId !== exerciseId),
          pendingSets: (() => {
            const copy = { ...state.pendingSets }
            delete copy[exerciseId]
            return copy
          })()
        })),

      setPendingSets: (exerciseId, pendingSetsList) =>
        set((state) => ({
          pendingSets: {
            ...state.pendingSets,
            [exerciseId]: pendingSetsList,
          },
        })),

      updatePendingSet: (exerciseId, index, updates) =>
        set((state) => {
          const exerciseSets = state.pendingSets[exerciseId] || []
          const updated = exerciseSets.map((s, i) =>
            i === index ? { ...s, ...updates } : s
          )
          return {
            pendingSets: {
              ...state.pendingSets,
              [exerciseId]: updated,
            },
          }
        }),

      addPendingSetRow: (exerciseId, newSet) =>
        set((state) => {
          const exerciseSets = state.pendingSets[exerciseId] || []
          return {
            pendingSets: {
              ...state.pendingSets,
              [exerciseId]: [...exerciseSets, newSet],
            },
          }
        }),

      removePendingSetRow: (exerciseId, index) =>
        set((state) => {
          const exerciseSets = state.pendingSets[exerciseId] || []
          const filtered = exerciseSets.filter((_, i) => i !== index)
          return {
            pendingSets: {
              ...state.pendingSets,
              [exerciseId]: filtered,
            },
          }
        }),
    }), {
    name: 'active-session', // nombre de la clave en localStorage
    partialize: (state) => ({       // solo persiste lo necesario
      sessionId: state.sessionId,
      sessionName: state.sessionName,
      routineId: state.routineId,
      weekNumber: state.weekNumber,
      blockNumber: state.blockNumber,
      sets: state.sets,
      startedAt: state.startedAt,
      elapsedSeconds: state.elapsedSeconds,
      sessionExercises: state.sessionExercises,
      pendingSets: state.pendingSets,
    }),
  })
)

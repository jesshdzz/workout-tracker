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

export type SessionExercise = {
  exerciseId: string
  exerciseName: string
  order: number
}

type SessionStore = {
  sessionId: string | null
  sessionName: string | null
  currentExercise: Exercise | null
  sets: ActiveSet[]
  isResting: boolean
  restSeconds: number
  elapsedSeconds: number
  startedAt: number | null
  sessionExercises: SessionExercise[]

  // Acciones
  initSession: (sessionId: string, name?: string | null) => void
  setCurrentExercise: (exercise: Exercise) => void
  addSet: (set: ActiveSet) => void
  markPR: (setNumber: number, exerciseId: string) => void
  startRest: (seconds: number) => void
  stopRest: () => void
  tickRest: () => void
  tickElapsed: () => void
  reset: () => void
  addExerciseToSession: (exercise: SessionExercise) => void
  reorderExercises: (from: number, to: number) => void
  updateSet: (id: string, updates: Partial<ActiveSet>) => void
}

const initialState = {
  sessionId: null,
  sessionName: null,
  currentExercise: null,
  sets: [],
  isResting: false,
  restSeconds: 0,
  elapsedSeconds: 0,
  startedAt: null,
  sessionExercises: [],
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      ...initialState,

      initSession: (sessionId: string, name?: string | null) => set({ sessionId, sessionName: name, startedAt: Date.now(), elapsedSeconds: 0 }),

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
        set((state) => ({
          sessionExercises: [
            ...state.sessionExercises,
            { ...exercise, order: state.sessionExercises.length },
          ],
        })),

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
    }), {
    name: 'active-session', // nombre de la clave en localStorage
    partialize: (state) => ({       // solo persiste lo necesario
      sessionId: state.sessionId,
      sessionName: state.sessionName,
      sets: state.sets,
      startedAt: state.startedAt,
      elapsedSeconds: state.elapsedSeconds,
      sessionExercises: state.sessionExercises,
    }),
  })
)

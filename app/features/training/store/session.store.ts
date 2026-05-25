import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '~/core/types/database.types'
import type { WeightUnit } from '~/core/types/common.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

export type ActiveSet = {
  exerciseId: string
  exerciseName: string
  setNumber: number
  setType: 'warmup' | 'effective'
  weight: number
  weightUnit: WeightUnit
  reps: number
  rirPerceived: number
  completed: boolean
  isPR: boolean
}

type SessionStore = {
  sessionId: string | null
  sessionName: string | null
  currentExercise: Exercise | null
  sets: ActiveSet[]
  isResting: boolean
  restSeconds: number
  elapsedSeconds: number

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
}

const initialState = {
  sessionId: null,
  sessionName: null,
  currentExercise: null,
  sets: [],
  isResting: false,
  restSeconds: 0,
  elapsedSeconds: 0,
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      ...initialState,

      initSession: (sessionId: string, name?: string | null) => set({ sessionId, sessionName: name }),

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
        set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

      reset: () => set(initialState),
    }), {
    name: 'active-session', // nombre de la clave en localStorage
    partialize: (state) => ({       // solo persiste lo necesario
      sessionId: state.sessionId,
      sessionName: state.sessionName,
      sets: state.sets,
      elapsedSeconds: state.elapsedSeconds,
    }),
  })
)

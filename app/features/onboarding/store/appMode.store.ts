import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Modo de uso de la aplicación.
 *
 * - `'free'`          → Registro libre sin planificación programada
 * - `'periodization'` → Sistema de periodización con bloques y semanas
 * - `null`            → Sin elegir todavía (muestra onboarding en el primer acceso)
 */
export type AppMode = 'free' | 'periodization' | null

type AppModeStore = {
  mode: AppMode
  setMode: (mode: AppMode) => void
  resetMode: () => void
}

/**
 * Store persistido en localStorage para el modo de la app.
 * Separado del session store para que el modo sobreviva al reset de sesión.
 *
 * Siguiendo 'client-localstorage-schema' de vercel-react-best-practices:
 * la clave incluye un prefijo de versión para facilitar migraciones futuras.
 */
export const useAppModeStore = create<AppModeStore>()(
  persist(
    (set) => ({
      mode: null,
      setMode: (mode) => set({ mode }),
      resetMode: () => set({ mode: null }),
    }),
    {
      name: 'app-mode-v1', // versión en el nombre para facilitar migraciones
    }
  )
)

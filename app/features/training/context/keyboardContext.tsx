import { createContext, useContext } from 'react'
import type { useNumericKeyboard } from '~/shared/hooks/useNumericKeyboard'

type KeyboardContextType = ReturnType<typeof useNumericKeyboard>

const KeyboardContext = createContext<KeyboardContextType | null>(null)

export const KeyboardProvider = KeyboardContext.Provider

export function useKeyboard() {
    const ctx = useContext(KeyboardContext)
    if (!ctx) throw new Error('useKeyboard debe usarse dentro de KeyboardProvider')
    return ctx
}
import { useState, useCallback } from 'react'

type Field = {
    key: string
    value: string
    label: string
    decimal: boolean
    onCommit: (value: string) => void
}

export function useNumericKeyboard() {
    const [activeField, setActiveField] = useState<Field | null>(null)

    const openKeyboard = useCallback((field: Field) => {
        setActiveField(field)
    }, [])

    const closeKeyboard = useCallback(() => {
        setActiveField(null)
    }, [])

    const handleChange = useCallback((value: string) => {
        if (!activeField) return
        setActiveField(prev => prev ? { ...prev, value } : null)
    }, [activeField])

    const handleCommit = useCallback(() => {
        if (!activeField) return
        activeField.onCommit(activeField.value)
        setActiveField(null)
    }, [activeField])

    return {
        activeField,
        isOpen: !!activeField,
        openKeyboard,
        closeKeyboard: handleCommit,
        handleChange,
    }
}
import { useEffect, useState, useCallback } from 'react'
import { drainQueue, getQueue } from './syncQueue'

export function useOnlineSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [pendingCount, setPendingCount] = useState(getQueue().length)

    const drain = useCallback(async () => {
        await drainQueue()
        setPendingCount(getQueue().length)
    }, [])

    useEffect(() => {
        const handleOnline = async () => {
            setIsOnline(true)
            await drain()
        }
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Intenta drenar al montar si hay operaciones pendientes
        if (navigator.onLine && getQueue().length > 0) drain()

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [drain])

    return { isOnline, pendingCount }
}
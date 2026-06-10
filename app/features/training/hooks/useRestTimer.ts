// app/features/training/hooks/useRestTimer.ts
import { useEffect, useRef } from 'react'
import { useSessionStore } from '../store/session.store'

export function useRestTimer() {
  const { isResting, restSeconds, tickRest, stopRest, startRest } = useSessionStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isResting) {
      intervalRef.current = setInterval(() => {
        tickRest()
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isResting, tickRest])

  // Alerta cuando termina el descanso
  useEffect(() => {
    if (!isResting && restSeconds === 0) return
    if (restSeconds === 0 && isResting) {
      // Notificación del sistema vía Service Worker
      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('¡Descanso completado!', {
            body: 'Es hora de tu siguiente serie. ¡A darle!',
            icon: '/pwa-192x192.png',
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true
          } as NotificationOptions & { vibrate?: number[] })
        }).catch(() => {})
      }

      // Beep simple con Web Audio API
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
      } catch (_) {}
    }
  }, [restSeconds, isResting])

  const handleStartRest = (seconds: number) => {
    // Pedir permiso de notificaciones en el gesto del usuario
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    startRest(seconds)
  }

  return {
    isResting,
    restSeconds,
    startRest: handleStartRest,
    stopRest,
  }
}
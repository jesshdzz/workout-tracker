import { useRestTimer } from '../hooks/useRestTimer'

const REST_PRESETS = [60, 90, 120, 180]

export function RestTimer() {
    const { isResting, restSeconds, startRest, stopRest } = useRestTimer()

    const minutes = Math.floor(restSeconds / 60)
    const seconds = restSeconds % 60
}
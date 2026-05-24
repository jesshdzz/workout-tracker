import { useRestTimer } from '../hooks/useRestTimer'
import { Button } from '~/components/ui/button'

const REST_PRESETS = [60, 90, 120, 180]

export function RestTimer() {
    const { isResting, restSeconds, startRest, stopRest } = useRestTimer()

    if (!isResting) {
        return (
            <div className="flex items-center gap-1.5">
                {REST_PRESETS.map(s => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => startRest(s)}
                        className="px-2.5 h-7 text-xs font-medium rounded-lg bg-card text-muted-foreground border border-border hover:bg-muted transition-colors"
                    >
                        {s >= 120 ? `${s / 60}m` : `${s}s`}
                    </button>
                ))}
            </div>
        )
    }

    const minutes = Math.floor(restSeconds / 60)
    const seconds = restSeconds % 60
    const progress = 1 - restSeconds / 90

    return (
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="17" fill="none" stroke="hsl(var(--primary) / 0.2)" strokeWidth="3" />
                    <circle
                        cx="20" cy="20" r="17"
                        fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                        strokeDasharray={106.8}
                        strokeDashoffset={106.8 * (1 - progress)}
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-primary">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>
            <span className="text-xs font-medium text-primary flex-1">Descanso</span>
            <Button variant="ghost" size="xs" onClick={stopRest} className="h-7 text-xs">
                Saltar
            </Button>
        </div>
    )
}

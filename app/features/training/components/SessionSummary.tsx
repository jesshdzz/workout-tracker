import { formatDuration } from '~/core/utils/formatters'
import { Clock, Dumbbell, Trophy, ListChecks } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useNavigate } from 'react-router'
import type { ActiveSet } from '../store/session.store'

type Props = {
    sets: ActiveSet[]
    elapsedSeconds: number
    onSave: () => void
    onDiscard: () => void
}

export function SessionSummary({ sets, elapsedSeconds, onSave, onDiscard }: Props) {
    const navigate = useNavigate()
    const effectiveSets = sets.filter((s) => s.setType === 'effective')
    const prs = sets.filter((s) => s.isPR)
    const exercises = [...new Set(sets.map((s) => s.exerciseName))]

    const totalSets = sets.length
    const exercisesWorked = new Set(sets.map(s => s.exerciseId)).size
    const totalWeight = sets.reduce((acc, s) => acc + s.weight * s.reps, 0)

    const stats = [
        { icon: Clock, label: 'Duración', value: formatDuration(elapsedSeconds) },
        { icon: ListChecks, label: 'Series', value: `${totalSets}` },
        { icon: Dumbbell, label: 'Ejercicios', value: `${exercisesWorked}` },
        { icon: Trophy, label: 'PRs', value: `${prs.length}`, highlight: prs.length > 0 },
    ]

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-foreground/20 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 space-y-6 border bg-card rounded-t-2xl sm:rounded-2xl border-border">
                <div className="text-center">
                    <div className="flex items-center justify-center mx-auto mb-3 rounded-full w-14 h-14 bg-primary/10">
                        <Trophy size={24} className="text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Sesión completada</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Buen trabajo</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {stats.map(({ icon: Icon, label, value, highlight }) => (
                        <div
                            key={label}
                            className={`rounded-xl p-3 border text-center ${highlight
                                ? 'bg-primary/10 border-primary/20'
                                : 'bg-muted border-border'
                                }`}
                        >
                            <Icon size={16} className={`mx-auto mb-1 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`text-lg font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
                                {value}
                            </p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                    ))}
                </div>
                
                <div className="w-full space-y-3">
                    <Button
                        onClick={onSave}
                        className="w-full h-12 font-medium"
                    >
                        Guardar y salir
                    </Button>
                    <button
                        type="button"
                        onClick={async () => { await onDiscard(); navigate('/app') }}
                        className="w-full text-sm text-center transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                        Ir al dashboard
                    </button>
                </div>
            </div>
        </div>
    )
}

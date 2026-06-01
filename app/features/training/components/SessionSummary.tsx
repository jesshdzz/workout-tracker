import { formatDuration } from '~/core/utils/formatters'
import { Clock, Dumbbell, Trophy, ListChecks } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useNavigate } from 'react-router'
import type { ActiveSet } from '../store/session.store'

type Props = {
    sets: ActiveSet[]
    elapsedSeconds: number
    sessionName: string | null
    onSaveWithRoutine: () => void   // guarda historial + abre builder de rutina
    onSaveOnly: () => void   // solo historial
    onDiscard: () => void   // descarta todo
}

export function SessionSummary({
    sets, elapsedSeconds, sessionName,
    onSaveWithRoutine, onSaveOnly, onDiscard
}: Props) {
    const effectiveSets = sets.filter(s => s.setType === 'effective')
    const prs = sets.filter(s => s.isPR)
    const exercisesWorked = new Set(sets.map(s => s.exerciseId)).size
    const totalWeight = sets.reduce((acc, s) => acc + s.weight * s.reps, 0)

    const stats = [
        { icon: Clock, label: 'Duración', value: formatDuration(elapsedSeconds) },
        { icon: ListChecks, label: 'Series', value: effectiveSets.length.toString() },
        { icon: Dumbbell, label: 'Ejercicios', value: exercisesWorked.toString() },
        { icon: Trophy, label: 'PRs', value: prs.length.toString(), highlight: prs.length > 0 },
    ]

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-foreground/20 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 space-y-5 border bg-card rounded-t-2xl sm:rounded-2xl border-border">

                <div className="space-y-1 text-center">
                    <div className="flex items-center justify-center mx-auto mb-3 rounded-full w-14 h-14 bg-primary/10">
                        <Trophy size={24} className="text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">¡Entreno completado!</h2>
                    <p className="text-sm text-muted-foreground">
                        {sessionName ?? 'Sesión sin nombre'}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                    {stats.map(({ icon: Icon, label, value, highlight }) => (
                        <div
                            key={label}
                            className={`rounded-xl p-3 border text-center ${highlight
                                ? 'bg-primary/10 border-primary/20'
                                : 'bg-muted border-border'
                                }`}
                        >
                            <Icon size={16} className={`mx-auto mb-1 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`text-lg font-bold font-mono ${highlight ? 'text-primary' : 'text-foreground'}`}>
                                {value}
                            </p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                    ))}
                </div>

                {/* 3 opciones */}
                <div className="space-y-2">
                    <Button onClick={onSaveWithRoutine} className="w-full h-11">
                        Guardar y crear plantilla
                    </Button>
                    <Button variant="outline" onClick={onSaveOnly} className="w-full h-11">
                        Solo guardar en historial
                    </Button>
                    <button
                        type="button"
                        onClick={onDiscard}
                        className="w-full py-2.5 text-sm text-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Descartar entreno
                    </button>
                </div>

            </div>
        </div>
    )
}
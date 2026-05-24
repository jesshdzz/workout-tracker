import { useSessionStore } from '../store/session.store'
import { formatDuration } from '~/core/utils/formatters'
import { Button } from '~/components/ui/button'
import { Clock, Dumbbell, Trophy, ListChecks } from 'lucide-react'
import { useNavigate } from 'react-router'

type Props = {
    onClose?: () => void
}

export function SessionSummary({ onClose }: Props) {
    const { elapsedSeconds, sets } = useSessionStore()
    const navigate = useNavigate()

    const totalSets = sets.length
    const exercisesWorked = new Set(sets.map(s => s.exerciseId)).size
    const prs = sets.filter(s => s.isPR).length
    const totalWeight = sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0)

    const stats = [
        { icon: Clock, label: 'Duración', value: formatDuration(elapsedSeconds) },
        { icon: ListChecks, label: 'Series', value: `${totalSets}` },
        { icon: Dumbbell, label: 'Ejercicios', value: `${exercisesWorked}` },
        { icon: Trophy, label: 'PRs', value: `${prs}`, highlight: prs > 0 },
    ]

    const handleClose = () => {
        if (onClose) onClose()
        navigate('/app')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-6 border border-border">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
                        <Trophy size={24} className="text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Sesión completada</h2>
                    <p className="text-sm text-muted-foreground mt-1">Buen trabajo</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {stats.map(({ icon: Icon, label, value, highlight }) => (
                        <div
                            key={label}
                            className={`rounded-xl p-3 border text-center ${
                                highlight
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

                <Button onClick={handleClose} className="w-full">
                    Volver al inicio
                </Button>
            </div>
        </div>
    )
}

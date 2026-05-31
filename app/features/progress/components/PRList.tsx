import { Trophy, TrendingUp } from 'lucide-react'
import { formatDateShort } from '~/core/utils/formatters'
import type { ExercisePR } from '../hooks/useProgress'

type Props = { prs: ExercisePR[] }

export function PRList({ prs }: Props) {
    if (prs.length === 0) {
        return (
            <div className="p-8 text-center border rounded-2xl bg-card border-border">
                <Trophy size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Aún no tienes récords. ¡Completa tu primera sesión!
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden border rounded-2xl bg-card border-border">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Trophy size={14} className="text-primary" />
                <p className="text-sm font-medium text-foreground">Mejores marcas</p>
            </div>
            <ul className="divide-y divide-border">
                {prs.map((pr) => (
                    <li key={pr.exerciseId} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">{pr.exerciseName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDateShort(pr.achievedAt)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-lg font-bold text-primary">
                                {pr.rmKg.toFixed(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">kg RM</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
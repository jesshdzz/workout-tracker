// app/features/progress/components/SessionHistory.tsx
import { Link } from 'react-router'
import { formatRelative, formatDuration } from '~/core/utils/formatters'
import { ChevronRight, Dumbbell, Clock } from 'lucide-react'
import type { SessionStat } from '../hooks/useProgress'

type Props = { sessions: SessionStat[] }

export function SessionHistory({ sessions }: Props) {
    if (sessions.length === 0) {
        return (
            <div className="p-8 text-center border rounded-2xl bg-card border-border">
                <Dumbbell size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Aún no hay sesiones completadas
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden border rounded-2xl bg-card border-border">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Clock size={14} className="text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Sesiones recientes</p>
            </div>
            <ul className="divide-y divide-border">
                {sessions.map((session) => (
                    <li key={session.id}>
                        <Link
                            to={`/app/training/${session.id}`}
                            className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-foreground">
                                    {session.name ?? 'Sesión sin nombre'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatRelative(session.date)}
                                    {session.totalSets > 0 && ` · ${session.totalSets} series`}
                                    {session.duration && ` · ${formatDuration(session.duration)}`}
                                </p>
                            </div>
                            <ChevronRight size={14} className="ml-2 text-muted-foreground shrink-0" />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
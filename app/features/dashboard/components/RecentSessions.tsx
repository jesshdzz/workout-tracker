import { Link } from 'react-router'
import { formatRelative } from '~/core/utils/formatters'
import { ChevronRight } from 'lucide-react'
import type { Database } from '~/core/types/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type Props = { sessions: Session[] }

export function RecentSessions({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center rounded-2xl bg-card shadow-sm border border-border">
        <p className="text-sm text-muted-foreground">Aún no hay sesiones registradas</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">Sesiones recientes</p>
      </div>
      <ul>
        {sessions.map((session, i) => (
          <li key={session.id}>
            <Link
              to={`/app/training/${session.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {session.name ?? 'Sesión sin nombre'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelative(session.date)}
                  {session.week_number ? ` · Semana ${session.week_number}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {session.completed ? (
                  <span className="text-xs font-medium text-accent">Completada</span>
                ) : (
                  <span className="text-xs font-medium text-destructive">En progreso</span>
                )}
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </Link>
            {i < sessions.length - 1 && <div className="h-px mx-4 bg-border" />}
          </li>
        ))}
      </ul>
    </div>
  )
}

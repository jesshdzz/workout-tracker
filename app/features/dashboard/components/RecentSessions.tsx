// app/features/dashboard/components/RecentSessions.tsx
import { Link } from 'react-router'
import { formatRelative } from '~/core/utils/formatters'
import { ChevronRight } from 'lucide-react'
import type { Database } from '~/core/types/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type Props = { sessions: Session[] }

export function RecentSessions({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center rounded-2xl bg-surface">
        <p className="text-sm text-muted">Aún no hay sesiones registradas</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      <div className="px-4 py-3 border-b border-bg">
        <p className="text-sm font-medium text-white">Sesiones recientes</p>
      </div>
      <ul>
        {sessions.map((session, i) => (
          <li key={session.id}>
            <Link
              to={`/app/training/${session.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-bg/50"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {session.name ?? 'Sesión sin nombre'}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {formatRelative(session.date)}
                  {session.week_number ? ` · Semana ${session.week_number}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {session.completed ? (
                  <span className="text-xs font-medium text-primary">Completada</span>
                ) : (
                  <span className="text-xs font-medium text-danger">En progreso</span>
                )}
                <ChevronRight size={14} className="text-muted" />
              </div>
            </Link>
            {i < sessions.length - 1 && <div className="h-px mx-4 bg-bg" />}
          </li>
        ))}
      </ul>
    </div>
  )
}
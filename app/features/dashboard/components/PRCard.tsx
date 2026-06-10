import { Trophy } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { formatDate } from '~/core/utils/formatters'
import type { PRWithExercise } from '../hooks/useDashboard'

type Props = { prs: PRWithExercise[] }

export function PRCard({ prs }: Props) {
  if (prs.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Trophy size={14} className="text-primary" />
        <p className="text-sm font-medium text-foreground">Récords recientes</p>
      </div>
      <ul>
        {prs.map((pr, i) => (
          <li key={pr.id}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                {/* Nombre del ejercicio — usando Badge con variante semántica */}
                <p className="text-sm font-semibold text-foreground truncate">
                  {pr.exercises?.name_es ?? pr.exercises?.name ?? '—'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                    {pr.record_type === 'estimated_1rm' ? '1RM est.' : pr.record_type}
                  </Badge>
                  <span className="text-sm font-mono font-medium text-foreground">
                    {pr.value.toFixed(1)} kg
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground shrink-0 ml-3">
                {formatDate(pr.achieved_at)}
              </p>
            </div>
            {i < prs.length - 1 && <div className="h-px mx-4 bg-border" />}
          </li>
        ))}
      </ul>
    </div>
  )
}

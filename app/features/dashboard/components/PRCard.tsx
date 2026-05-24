// app/features/dashboard/components/PRCard.tsx
import { Trophy } from 'lucide-react'
import { formatDate } from '~/core/utils/formatters'
import type { Database } from '~/core/types/database.types'

type PR = Database['public']['Tables']['personal_records']['Row']
type Props = { prs: PR[] }

export function PRCard({ prs }: Props) {
  if (prs.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-bg">
        <Trophy size={14} className="text-primary" />
        <p className="text-sm font-medium text-white">Récords recientes</p>
      </div>
      <ul>
        {prs.map((pr, i) => (
          <li key={pr.id}>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xs tracking-widest uppercase text-muted">
                  {pr.record_type === 'estimated_1rm' ? '1RM estimado' : pr.record_type}
                </p>
                <p className="text-sm text-white font-medium mt-0.5">
                  {pr.value.toFixed(1)} kg
                </p>
              </div>
              <p className="text-xs text-muted">{formatDate(pr.achieved_at)}</p>
            </div>
            {i < prs.length - 1 && <div className="h-px mx-4 bg-bg" />}
          </li>
        ))}
      </ul>
    </div>
  )
}
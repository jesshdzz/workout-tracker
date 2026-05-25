import { ArrowLeft, Clock, Dumbbell, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate } from '~/core/utils/formatters'

type Props = {
  name: string | null
  date: string
  completed: boolean
  durationLabel: string
  totalSets: number
  totalPRs: number
  routineName?: string | null
  weekNumber?: number | null
}

export function SessionHeader({
  name,
  date,
  completed,
  durationLabel,
  totalSets,
  totalPRs,
  routineName,
  weekNumber,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <Link
          to="/app"
          className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs text-muted-foreground">
          {completed ? 'Sesión completada' : 'Sesión en progreso'}
        </span>
      </div>

      {/* Título */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            {name ?? 'Sesión sin nombre'}
          </h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            completed
              ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-destructive'
          }`}>
            {completed ? 'Completada' : 'En progreso'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(date)}</span>
          {routineName && <><span>·</span><span>{routineName}</span></>}
          {weekNumber && <><span>·</span><span>Semana {weekNumber}</span></>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Clock,    label: 'Duración', value: durationLabel },
          { icon: Dumbbell, label: 'Series',   value: totalSets.toString() },
          { icon: Trophy,   label: 'PRs',      value: totalPRs.toString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-3 space-y-1 text-center rounded-2xl bg-card">
            <Icon size={14} className="mx-auto text-primary" />
            <p className="font-mono text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
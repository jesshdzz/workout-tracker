import { getBlockConfig } from '~/core/utils/periodization'
import { Progress } from '~/components/ui/progress'

type Props = { currentWeek: number }

export function BlockProgress({ currentWeek }: Props) {
  const config = getBlockConfig(currentWeek)
  const weekInBlock = ((currentWeek - 1) % 4) + 1
  const progress = (weekInBlock / 4) * 100

  const blockColors: Record<number, string> = {
    1: 'text-secondary',
    2: 'text-primary',
    3: 'text-destructive',
    4: 'text-muted-foreground',
  }

  return (
    <div className="p-4 space-y-3 rounded-2xl bg-card shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground">Bloque {config.block}</p>
          <p className={`text-lg font-bold ${blockColors[config.block]}`}>
            {config.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Semana</p>
          <p className="font-mono text-3xl font-bold text-foreground">{currentWeek}</p>
        </div>
      </div>

      <Progress value={progress} className="h-1.5 bg-muted" />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{config.repRange} reps · {config.rir}</span>
        <span>{config.intensityPct * 100}% RM</span>
      </div>

      {config.isDeload && (
        <div className="px-3 py-2 border rounded-lg bg-destructive/10 border-destructive/20">
          <p className="text-xs font-medium text-destructive">
            Semana de deload — Volumen reducido 40%
          </p>
        </div>
      )}
    </div>
  )
}

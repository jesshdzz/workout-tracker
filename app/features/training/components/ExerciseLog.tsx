import { Trophy } from 'lucide-react'
import type { Database } from '~/core/types/database.types'

type Set = Database['public']['Tables']['sets']['Row']

type SetWithExercise = Set & {
  exercises: { id: string; name: string; name_es: string | null; slug: string } | null
}

type Props = {
  exerciseName: string
  sets: SetWithExercise[]
}

export function ExerciseLog({ exerciseName, sets }: Props) {
  const warmups   = sets.filter((s) => s.set_type === 'warmup')
  const effectives = sets.filter((s) => s.set_type === 'effective')

  return (
    <div className="overflow-hidden rounded-2xl bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">{exerciseName}</p>
        <p className="text-xs text-muted-foreground">
          {effectives.length} serie{effectives.length !== 1 ? 's' : ''} efectiva{effectives.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Sets */}
      <div className="divide-y divide-border">
        {warmups.length > 0 && (
          <div className="px-4 py-2">
            <p className="mb-2 text-xs text-muted-foreground">Calentamiento</p>
            <div className="space-y-1.5">
              {warmups.map((set) => (
                <SetRow key={set.id} set={set} />
              ))}
            </div>
          </div>
        )}

        {effectives.length > 0 && (
          <div className="px-4 py-2">
            <p className="mb-2 text-xs text-muted-foreground">Efectivas</p>
            <div className="space-y-1.5">
              {effectives.map((set) => (
                <SetRow key={set.id} set={set} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SetRow({ set }: { set: SetWithExercise }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${
      set.is_pr ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
    }`}>
      <div className="flex items-center gap-3">
        <span className="w-4 text-xs text-muted-foreground">#{set.set_number}</span>
        <span className="font-mono text-sm text-foreground">
          {set.weight ?? set.weight} {set.weight_unit}
          <span className="mx-1 text-muted-foreground">×</span>
          {set.reps} reps
        </span>
      </div>
      <div className="flex items-center gap-2">
        {set.rir_perceived !== null && (
          <span className="text-xs text-muted-foreground">RIR {set.rir_perceived}</span>
        )}
        {set.is_pr && (
          <div className="flex items-center gap-1 text-primary">
            <Trophy size={12} />
            <span className="text-xs font-bold">PR</span>
          </div>
        )}
      </div>
    </div>
  )
}
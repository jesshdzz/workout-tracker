// app/features/training/components/ExerciseCard.tsx
import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { SetLogger } from './SetLogger'
import { useActiveSession } from '../hooks/useActiveSession'
import type { Database } from '~/core/types/database.types'
import type { WeightUnit } from '~/core/types/common.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

type Props = {
  exercise: Exercise
  suggestedWeight?: number
  suggestedReps?: string
  weightUnit: WeightUnit
  targetSets: number
}

export function ExerciseCard({
  exercise,
  suggestedWeight,
  suggestedReps,
  weightUnit,
  targetSets,
}: Props) {
  const { logSet, setsForExercise } = useActiveSession()
  const [expanded, setExpanded] = useState(true)
  const completedSets = setsForExercise(exercise.id)
  const nextSetNumber = completedSets.length + 1
  const allDone = completedSets.length >= targetSets

  const handleLog = async (data: {
    weight: number
    reps: number
    rirPerceived: number
    restAfterSeconds: number
  }) => {
    const result = await logSet({
      exerciseId: exercise.id,
      exerciseName: exercise.name_es ?? exercise.name,
      setNumber: nextSetNumber,
      setType: nextSetNumber === 1 ? 'warmup' : 'effective',
      weight: data.weight,
      weightUnit,
      reps: data.reps,
      rirPerceived: data.rirPerceived,
      restAfterSeconds: data.restAfterSeconds,
    })

    if (!result) return null
    return { isPR: result.isPR }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-4"
      >
        <div className="text-left">
          <p className="font-medium text-foreground">
            {exercise.name_es ?? exercise.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedSets.length} / {targetSets} series
            {allDone && ' · ✅ Completado'}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Técnica */}
          {exercise.technique_notes && (
            <div className="flex gap-2 px-3 py-2 rounded-lg bg-muted">
              <Info size={12} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{exercise.technique_notes}</p>
            </div>
          )}

          {/* Series completadas */}
          {completedSets.map((s) => (
            <div
              key={`${s.exerciseId}-${s.setNumber}`}
              className={`rounded-xl p-3 ${s.isPR ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Serie {s.setNumber} · {s.setType === 'warmup' ? 'Calentamiento' : 'Efectiva'}
                </p>
                {s.isPR && <span className="text-xs font-bold text-primary">🏆 PR</span>}
              </div>
              <p className="text-foreground text-sm font-medium mt-0.5">
                {s.weightKg} {s.weightUnit} × {s.reps} reps · RIR {s.rirPerceived}
              </p>
            </div>
          ))}

          {/* Logger de siguiente serie */}
          {!allDone && (
            <SetLogger
              exerciseId={exercise.id}
              exerciseName={exercise.name_es ?? exercise.name}
              setNumber={nextSetNumber}
              setType={nextSetNumber === 1 ? 'warmup' : 'effective'}
              suggestedWeight={suggestedWeight}
              suggestedReps={suggestedReps}
              weightUnit={weightUnit}
              onLog={handleLog}
            />
          )}
        </div>
      )}
    </div>
  )
}
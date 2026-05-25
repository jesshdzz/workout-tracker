import { useState } from 'react'
import { ChevronDown, ChevronUp, Info, Trophy, History } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SetLogger } from './SetLogger'
import { EditableSetRow } from './EditableSetRow'
import { useActiveSession } from '../hooks/useActiveSession'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { useSessionStore } from '../store/session.store'
import { formatDateShort } from '~/core/utils/formatters'
import type { Database } from '~/core/types/database.types'
import type { WeightUnit } from '~/core/types/common.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

type Props = {
  exercise: Exercise
  weightUnit: WeightUnit
  targetSets: number
  isDragging?: boolean
}

export function ExerciseCard({ exercise, weightUnit, targetSets, isDragging }: Props) {
  const { logSet, setsForExercise, updateSetInStore } = useActiveSession()
  const { sessionId } = useSessionStore()
  const { history } = useExerciseHistory(exercise.id, sessionId)

  const [expanded, setExpanded]         = useState(true)
  const [showHistory, setShowHistory]   = useState(false)

  const completedSets = setsForExercise(exercise.id)
  const nextSetNumber = completedSets.length + 1

  const {
    attributes, listeners, setNodeRef,
    transform, transition,
  } = useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleLog = async (data: Parameters<typeof logSet>[0] extends infer T ? T : never) => {
    const result = await logSet(data)
    if (!result) return null
    return { isPR: result.isPR }
  }

  return (
    <div ref={setNodeRef} style={style} className="overflow-hidden border rounded-2xl bg-card border-border">

      {/* Header — long press para arrastrar */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between px-4 py-3 border-b select-none border-border cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => {
          // Solo toggle si no fue un drag
          if (!(e.target as HTMLElement).closest('[data-dragging]')) {
            setExpanded(!expanded)
          }
        }}
      >
        <div>
          <p className="text-sm font-medium text-foreground">
            {exercise.name_es ?? exercise.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedSets.filter(s => s.setType === 'effective').length} series efectivas
            {completedSets.length > 0 && ' · mantén para mover'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {history && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory) }}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                showHistory ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History size={14} />
            </button>
          )}
          {expanded
            ? <ChevronUp size={16} className="text-muted-foreground" />
            : <ChevronDown size={16} className="text-muted-foreground" />
          }
        </div>
      </div>

      {expanded && (
        <div className="px-4 pt-3 pb-4 space-y-3">

          {/* Técnica del ejercicio */}
          {exercise.technique_notes && (
            <div className="flex gap-2 px-3 py-2 rounded-lg bg-muted">
              <Info size={12} className="text-secondary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{exercise.technique_notes}</p>
            </div>
          )}

          {/* Comparativa sesión anterior */}
          {showHistory && history && (
            <div className="p-3 space-y-2 border rounded-lg border-secondary/20 bg-secondary/5">
              <p className="text-xs font-medium text-secondary flex items-center gap-1.5">
                <History size={12} />
                Sesión anterior · {formatDateShort(history.sessionDate)}
                {history.sessionName && ` · ${history.sessionName}`}
              </p>
              <div className="space-y-1">
                {history.sets
                  .filter(s => s.setType === 'effective')
                  .map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Serie {s.setNumber}</span>
                      <span className="font-mono text-foreground">
                        {s.weight} {s.weightUnit} × {s.reps}
                        {s.technique === 'rest_pause' && s.restPauseReps &&
                          ` + ${s.restPauseReps}`}
                        {s.technique === 'drop_set' && s.dropWeight &&
                          ` → ${s.dropWeight} × ${s.dropReps}`}
                      </span>
                      {s.isPR && <Trophy size={10} className="text-primary" />}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Series completadas — editables */}
          {completedSets.map((s) => (
            <EditableSetRow
              key={s.id}
              set={s}
              onUpdate={(updates) => updateSetInStore(s.id, updates)}
            />
          ))}

          {/* Logger siguiente serie */}
          <SetLogger
            exerciseId={exercise.id}
            exerciseName={exercise.name_es ?? exercise.name}
            setNumber={nextSetNumber}
            setType={nextSetNumber === 1 ? 'warmup' : 'effective'}
            suggestedWeight={
              completedSets.length > 0
                ? completedSets[completedSets.length - 1].weight
                : history?.sets[history.sets.length - 1]?.weight
            }
            weightUnit={weightUnit}
            onLog={async (data) => {
              const result = await logSet({
                exerciseId: exercise.id,
                exerciseName: exercise.name_es ?? exercise.name,
                setNumber: nextSetNumber,
                ...data,
              })
              if (!result) return null
              return { isPR: result.isPR }
            }}
          />
        </div>
      )}
    </div>
  )
}
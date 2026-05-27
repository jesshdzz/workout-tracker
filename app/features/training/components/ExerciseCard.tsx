// app/features/training/components/ExerciseCard.tsx
import { useState } from 'react'
import { ChevronDown, ChevronUp, Info, History, Plus, Trash2 } from 'lucide-react'
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
  onRemove: () => void
}

export function ExerciseCard({ exercise, weightUnit, onRemove }: Props) {
  const { logSet, setsForExercise, updateSetInStore, deleteSetFromStore } = useActiveSession()
  const { sessionId } = useSessionStore()
  const { history } = useExerciseHistory(exercise.id, sessionId)

  const [expanded, setExpanded] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showLogger, setShowLogger] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const completedSets = setsForExercise(exercise.id)
  const effectiveSets = completedSets.filter(s => s.setType === 'effective')
  const nextSetNumber = effectiveSets.length + 1

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl bg-card border border-border overflow-hidden transition-shadow ${isDragging ? 'shadow-xl opacity-90 scale-[1.02]' : ''
        }`}
    >
      {/* Header — long press activa drag */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between px-4 py-3 border-b select-none border-border touch-none"
      >
        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => !isDragging && setExpanded(!expanded)}
        >
          <p className="text-sm font-medium text-foreground">
            {exercise.name_es ?? exercise.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {effectiveSets.length} serie{effectiveSets.length !== 1 ? 's' : ''} efectiva{effectiveSets.length !== 1 ? 's' : ''}
          </p>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Historial */}
          {history && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${showHistory
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <History size={14} />
            </button>
          )}

          {/* Eliminar ejercicio */}
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(true)}
            className="flex items-center justify-center transition-colors rounded-full w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} />
          </button>

          {/* Expandir */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center w-7 h-7 text-muted-foreground"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pt-3 pb-4 space-y-2">

          {/* Técnica */}
          {exercise.technique_notes && (
            <div className="flex gap-2 px-3 py-2 rounded-lg bg-muted">
              <Info size={12} className="text-secondary mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {exercise.technique_notes}
              </p>
            </div>
          )}

          {/* Historial sesión anterior */}
          {showHistory && history && (
            <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-3 space-y-1.5">
              <p className="text-xs font-medium text-secondary">
                {formatDateShort(history.sessionDate)}
                {history.sessionName && ` · ${history.sessionName}`}
              </p>
              {history.sets
                .filter(s => s.setType === 'effective')
                .map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">#{s.setNumber}</span>
                    <span className="font-mono text-foreground">
                      {s.weight} {s.weightUnit} × {s.reps}
                      {s.technique === 'rest_pause' && s.restPauseReps &&
                        <span className="text-secondary"> + {s.restPauseReps} rp</span>}
                      {s.technique === 'drop_set' && s.dropWeight &&
                        <span className="text-secondary"> ↓ {s.dropWeight} × {s.dropReps}</span>}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Header de columnas — solo si hay series */}
          {completedSets.length > 0 && (
            <div className="flex items-center gap-2 px-3 pb-1">
              <span className="w-5 text-xs text-center text-muted-foreground">#</span>
              <span className="flex-1 text-xs text-muted-foreground">Peso × Reps</span>
              <span className="text-xs text-muted-foreground">RIR</span>
              <span className="w-10" />
            </div>
          )}

          {/* Series registradas */}
          <div className="space-y-1.5">
            {completedSets.map((s) => (
              <EditableSetRow
                key={s.id}
                set={s}
                onUpdate={(updates) => updateSetInStore(s.id, updates)}
                onDelete={() => deleteSetFromStore(s.id)}
              />
            ))}
          </div>

          {/* Botón añadir serie / Logger */}
          {showLogger ? (
            <SetLogger
              exerciseId={exercise.id}
              exerciseName={exercise.name_es ?? exercise.name}
              setNumber={nextSetNumber}
              setType={completedSets.length === 0 ? 'warmup' : 'effective'}
              suggestedWeight={
                effectiveSets.length > 0
                  ? effectiveSets[effectiveSets.length - 1].weight
                  : history?.sets.filter(s => s.setType === 'effective').at(-1)?.weight
              }
              weightUnit={weightUnit}
              onCancel={() => setShowLogger(false)}
              onLog={async (data) => {
                const result = await logSet({
                  exerciseId: exercise.id,
                  exerciseName: exercise.name_es ?? exercise.name,
                  setNumber: nextSetNumber,
                  ...data,
                })
                if (!result) return null
                setShowLogger(false)
                return { isPR: result.isPR }
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowLogger(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Plus size={14} />
              Añadir serie
            </button>
          )}
        </div>
      )}

      {/* Confirmación eliminar ejercicio */}
      {showRemoveConfirm && (
        <div className="px-4 py-3 border-t bg-destructive/5 border-destructive/20">
          <p className="mb-3 text-sm text-foreground">
            ¿Eliminar <strong>{exercise.name_es ?? exercise.name}</strong> de la sesión?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRemoveConfirm(false)}
              className="flex-1 py-2 text-sm transition-colors rounded-lg bg-muted text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex-1 py-2 text-sm font-medium transition-colors rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
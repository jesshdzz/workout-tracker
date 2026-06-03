import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Info, History, Plus, Trash2, MoreHorizontal } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useActiveSession } from '../hooks/useActiveSession'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { useSessionStore, type PendingSet } from '../store/session.store'
import { useKeyboard } from '../context/keyboardContext'
import { formatDateShort } from '~/core/utils/formatters'
import type { Database } from '~/core/types/database.types'
import type { WeightUnit } from '~/core/types/common.types'

type Exercise = Database['public']['Tables']['exercises']['Row']
type Technique = 'normal' | 'rest_pause' | 'drop_set' | 'failure'

type Props = {
  exercise: Exercise
  weightUnit: WeightUnit
  onRemove: () => void
}

// Fila de serie — compacta pero completa
type SetRowProps = {
  index: number
  setNumber: number
  setType: 'warmup' | 'effective'
  weight: string
  reps: string
  technique: Technique
  rir: number
  prevLabel: string | null   // "56 kg × 13" de sesión anterior
  isCompleted: boolean
  isPR: boolean
  weightUnit: WeightUnit
  onTapWeight: () => void
  onTapReps: () => void
  onComplete: () => void
  onDelete: () => void
  onTechChange: (t: Technique) => void
  onRirChange: (r: number) => void
}

function SetRow({
  setNumber, setType, weight, reps, technique, rir,
  prevLabel, isCompleted, isPR, weightUnit,
  onTapWeight, onTapReps, onComplete, onDelete,
  onTechChange, onRirChange,
}: SetRowProps) {
  const [showOptions, setShowOptions] = useState(false)

  const TECHNIQUES: { value: Technique; short: string }[] = [
    { value: 'normal', short: 'N' },
    { value: 'failure', short: 'F' },
    { value: 'rest_pause', short: 'RP' },
    { value: 'drop_set', short: 'DS' },
  ]

  return (
    <div>
      <div className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${isCompleted ? 'bg-accent/5' : ''
        } ${isPR ? 'bg-primary/5' : ''}`}>

        {/* Número de serie */}
        <div className="text-center w-7 shrink-0">
          <span className={`text-xs font-bold ${setType === 'warmup'
            ? 'text-amber-500'
            : isCompleted
              ? 'text-accent'
              : 'text-muted-foreground'
            }`}>
            {setType === 'warmup' ? 'W' : setNumber}
          </span>
        </div>

        {/* Anterior */}
        <div className="flex-1 min-w-0">
          <span className="text-xs truncate text-muted-foreground">
            {prevLabel ?? '—'}
          </span>
        </div>

        {/* Peso */}
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onTapWeight() }}
          disabled={isCompleted}
          className={`w-16 py-1.5 rounded-lg text-sm font-mono font-medium text-center transition-colors ${isCompleted
            ? 'bg-transparent text-foreground'
            : weight
              ? 'bg-muted text-foreground'
              : 'bg-muted text-muted-foreground'
            }`}
        >
          {weight || '—'}
        </button>

        {/* Reps */}
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onTapReps() }}
          disabled={isCompleted}
          className={`w-14 py-1.5 rounded-lg text-sm font-mono font-medium text-center transition-colors ${isCompleted
            ? 'bg-transparent text-foreground'
            : reps
              ? 'bg-muted text-foreground'
              : 'bg-muted text-muted-foreground'
            }`}
        >
          {reps || '—'}
        </button>

        {/* Completar / PR indicator */}
        <button
          type="button"
          onClick={onComplete}
          disabled={!weight || !reps}
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isCompleted
            ? isPR
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground'
            : 'bg-muted text-muted-foreground disabled:opacity-30'
            }`}
        >
          {isCompleted ? (isPR ? '🏆' : '✓') : '✓'}
        </button>
      </div>

      {/* Panel de opciones expandible (técnica, RIR, eliminar) */}
      {!isCompleted && showOptions && (
        <div className="px-3 pb-2 space-y-2 bg-muted/30">
          {/* Técnica */}
          <div className="flex gap-1">
            {TECHNIQUES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => onTechChange(t.value)}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${technique === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border'
                  }`}
              >
                {t.short}
              </button>
            ))}
            <button
              type="button"
              onClick={onDelete}
              className="px-2 py-1 text-xs border rounded-md bg-card text-destructive border-border"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* RIR — solo si no es al fallo */}
          {technique !== 'failure' && (
            <div className="flex gap-1">
              <span className="self-center mr-1 text-xs text-muted-foreground">RIR</span>
              {[0, 1, 2, 3, 4].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRirChange(r)}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${rir === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground border border-border'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toggle opciones */}
      {!isCompleted && (
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="w-full flex items-center justify-center py-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-8 h-px bg-border" />
          <MoreHorizontal size={12} className="mx-1.5" />
          <div className="w-8 h-px bg-border" />
        </button>
      )}
    </div>
  )
}

export function ExerciseCard({ exercise, weightUnit, onRemove }: Props) {
  const { logSet, setsForExercise, deleteSetFromStore } = useActiveSession()
  const { sessionId, sessionExercises } = useSessionStore()
  const { history, loading: loadingHistory } = useExerciseHistory(exercise.id, sessionId)
  const keyboard = useKeyboard()

  const [expanded, setExpanded] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showRemove, setShowRemove] = useState(false)

  const completedSets = setsForExercise(exercise.id)
  const effectiveSets = completedSets.filter(s => s.setType === 'effective')

  const sessionEx = sessionExercises.find(ex => ex.exerciseId === exercise.id)
  const targetSets = sessionEx?.targetSets ?? 3

  // Series precargadas (vacías) basadas en targetSets
  const prevSets = history?.sets.filter(s => s.setType !== 'warmup') ?? []

  // Pending sets from global store
  const storePendingSets = useSessionStore(state => state.pendingSets[exercise.id])
  const setPendingSets = useSessionStore(state => state.setPendingSets)
  const updatePendingSet = useSessionStore(state => state.updatePendingSet)
  const addPendingSetRow = useSessionStore(state => state.addPendingSetRow)
  const removePendingSetRow = useSessionStore(state => state.removePendingSetRow)

  const pendingSets = storePendingSets || []

  // Inicializa las series pendientes cuando termine de cargar el historial
  useEffect(() => {
    if (!loadingHistory && !storePendingSets) {
      const initialRows = Math.max(targetSets, completedSets.length + 1)
      const initial: PendingSet[] = Array.from({ length: initialRows }, (_, i) => ({
        weight: prevSets[i]?.weight.toString() ?? '',
        reps: prevSets[i]?.reps.toString() ?? '',
        technique: 'normal' as Technique,
        rir: 2,
        setType: i === 0 ? 'warmup' : 'effective',
      }))
      setPendingSets(exercise.id, initial)
    }
  }, [loadingHistory, history, exercise.id, storePendingSets, targetSets, completedSets.length, setPendingSets])

  // Expande automáticamente el array de series pendientes si el número de series completadas crece
  useEffect(() => {
    if (storePendingSets && completedSets.length + 1 > storePendingSets.length) {
      const diff = completedSets.length + 1 - storePendingSets.length
      const updated = [...storePendingSets]
      for (let i = 0; i < diff; i++) {
        const nextIdx = storePendingSets.length + i
        const lastPrev = prevSets[nextIdx]
        updated.push({
          weight: lastPrev?.weight.toString() ?? '',
          reps: lastPrev?.reps.toString() ?? '',
          technique: 'normal' as Technique,
          rir: 2,
          setType: 'effective' as const,
        })
      }
      setPendingSets(exercise.id, updated)
    }
  }, [completedSets.length, storePendingSets, exercise.id, history, setPendingSets])

  const addRow = () => {
    const nextIdx = pendingSets.length
    const lastPrev = prevSets[nextIdx]
    addPendingSetRow(exercise.id, {
      weight: lastPrev?.weight.toString() ?? '',
      reps: lastPrev?.reps.toString() ?? '',
      technique: 'normal',
      rir: 2,
      setType: 'effective',
    })
  }

  const handleComplete = async (rowIndex: number) => {
    const pending = pendingSets[rowIndex]
    if (!pending.weight || !pending.reps) return

    const effectiveCount = completedSets.filter(
      (s, i) => s.setType === 'effective' && i < rowIndex
    ).length

    await logSet({
      exerciseId: exercise.id,
      exerciseName: exercise.name_es ?? exercise.name,
      setNumber: pending.setType === 'warmup' ? 0 : effectiveCount + 1,
      setType: pending.setType,
      technique: pending.technique,
      weight: parseFloat(pending.weight),
      weightUnit,
      reps: parseInt(pending.reps),
      rirPerceived: pending.technique === 'failure' ? 0 : pending.rir,
      restAfterSeconds: 90,
    })
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  // Label de anterior para cada fila
  const getPrevLabel = (rowIndex: number): string | null => {
    const prev = prevSets[rowIndex]
    if (!prev) return null
    return `${prev.weight} ${prev.weightUnit} × ${prev.reps}`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl bg-card border border-border overflow-hidden ${isDragging ? 'shadow-xl opacity-90' : ''
        }`}
    >
      {/* Header */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between px-4 py-3 select-none touch-none"
      >
        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => !isDragging && setExpanded(!expanded)}
        >
          <p className="text-sm font-semibold text-foreground">
            {exercise.name_es ?? exercise.name}
          </p>
          {sessionEx?.targetReps && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {sessionEx.targetReps} reps
              {sessionEx.targetRir !== null && ` | RIR ${sessionEx.targetRir}`}
              {sessionEx.intensityPct && ` | ${Math.round(sessionEx.intensityPct * 100)}%`}
            </p>
          )}
        </button>

        <div className="flex items-center gap-1">
          {history && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${showHistory ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground'
                }`}
            >
              <History size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowRemove(true)}
            className="flex items-center justify-center transition-colors rounded-full w-7 h-7 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
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
        <>
          {/* Notas de técnica */}
          {exercise.technique_notes && (
            <div className="flex gap-2 px-3 py-2 mx-3 mb-2 rounded-lg bg-muted">
              <Info size={12} className="text-secondary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{exercise.technique_notes}</p>
            </div>
          )}

          {/* Historial sesión anterior */}
          {showHistory && history && (
            <div className="p-3 mx-3 mb-2 space-y-1 border rounded-lg border-secondary/20 bg-secondary/5">
              <p className="text-xs font-medium text-secondary">
                {formatDateShort(history.sessionDate)}
                {history.sessionName && ` · ${history.sessionName}`}
              </p>
              {history.sets.filter(s => s.setType === 'effective').map((s, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">#{s.setNumber}</span>
                  <span className="font-mono text-foreground">
                    {s.weight} {s.weightUnit} × {s.reps}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tabla de series */}
          <div className="border-t border-border">
            {/* Header de columnas */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-muted/30">
              <div className="text-xs font-medium text-center w-7 text-muted-foreground">Ser.</div>
              <div className="flex-1 text-xs font-medium text-muted-foreground">Anterior</div>
              <div className="w-16 text-xs font-medium text-center text-muted-foreground">{weightUnit}</div>
              <div className="text-xs font-medium text-center w-14 text-muted-foreground">Rep.</div>
              <div className="w-8 text-xs font-medium text-center text-muted-foreground">✓</div>
            </div>

            {/* Filas de series */}
            {!storePendingSets && loadingHistory ? (
              <div className="flex justify-center items-center py-6">
                <div className="w-5 h-5 border-2 rounded-full animate-spin border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {pendingSets.map((pending, i) => {
                  const completed = completedSets[i]
                  const isCompleted = !!completed

                  return (
                    <SetRow
                      key={i}
                      index={i}
                      setNumber={pending.setType === 'warmup' ? 0 : i}
                      setType={pending.setType}
                      weight={isCompleted ? completed.weight.toString() : pending.weight}
                      reps={isCompleted ? completed.reps.toString() : pending.reps}
                      technique={isCompleted ? completed.technique : pending.technique}
                      rir={isCompleted ? completed.rirPerceived : pending.rir}
                      prevLabel={getPrevLabel(i)}
                      isCompleted={isCompleted}
                      isPR={isCompleted && completed.isPR}
                      weightUnit={weightUnit}
                      onTapWeight={() => keyboard.openKeyboard({
                        key: `weight-${exercise.id}-${i}`,
                        value: pending.weight,
                        label: `Peso — Serie ${i + 1}`,
                        decimal: true,
                        onCommit: (v) => updatePendingSet(exercise.id, i, { weight: v }),
                      })}
                      onTapReps={() => keyboard.openKeyboard({
                        key: `reps-${exercise.id}-${i}`,
                        value: pending.reps,
                        label: `Reps — Serie ${i + 1}`,
                        decimal: false,
                        onCommit: (v) => updatePendingSet(exercise.id, i, { reps: v }),
                      })}
                      onComplete={() => handleComplete(i)}
                      onDelete={() => {
                        if (isCompleted) deleteSetFromStore(completed.id)
                        else removePendingSetRow(exercise.id, i)
                      }}
                      onTechChange={(t) => updatePendingSet(exercise.id, i, { technique: t })}
                      onRirChange={(r) => updatePendingSet(exercise.id, i, { rir: r })}
                    />
                  )
                })}
              </div>
            )}

            {/* Añadir serie */}
            <button
              type="button"
              onClick={addRow}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground border-t border-border/50 transition-colors"
            >
              <Plus size={14} />
              Añadir serie
            </button>
          </div>
        </>
      )}

      {/* Confirmación eliminar */}
      {showRemove && (
        <div className="px-4 py-3 border-t bg-destructive/5 border-destructive/20">
          <p className="mb-3 text-sm text-foreground">
            ¿Eliminar <strong>{exercise.name_es ?? exercise.name}</strong>?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRemove(false)}
              className="flex-1 py-2 text-sm rounded-lg bg-muted text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
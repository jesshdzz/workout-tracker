import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Info, History, Plus, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useActiveSession } from '../hooks/useActiveSession'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { useSessionStore, type PendingSet, type ActiveSet } from '../store/session.store'
import { useKeyboard } from '../context/keyboardContext'
import { formatDateShort } from '~/core/utils/formatters'
import type { Database } from '~/core/types/database.types'
import type { WeightUnit } from '~/core/types/common.types'
import { useAuth } from '~/features/auth/AuthProvider'
import { progressionService } from '~/services/progression.service'
import { AIPrescriptionPanel } from './AIPrescriptionPanel'
import { SetRow } from './SetRow'
import type { ExercisePrescription } from '~/services/ai-trainer.service'

type Exercise = Database['public']['Tables']['exercises']['Row']
type Technique = 'normal' | 'rest_pause' | 'drop_set' | 'failure'

type Props = {
  exercise: Exercise
  weightUnit: WeightUnit
  onRemove: () => void
}

export function ExerciseCard({ exercise, weightUnit, onRemove }: Props) {
  const { user } = useAuth()
  const { logSet, setsForExercise, deleteSetFromStore, updateSetInStore } = useActiveSession()
  const { sessionId, sessionExercises, weekNumber } = useSessionStore()
  const { history, loading: loadingHistory } = useExerciseHistory(exercise.id, sessionId)
  const keyboard = useKeyboard()

  const [expanded, setExpanded] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [prescription, setPrescription] = useState<ExercisePrescription | null>(null)
  const [weightApplied, setWeightApplied] = useState(false)

  const completedSets = setsForExercise(exercise.id)

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
        technique: (prevSets[i]?.technique as Technique) ?? 'normal',
        rir: 2,
        setType: i === 0 ? 'warmup' : 'effective',
        restPauseReps: prevSets[i]?.restPauseReps?.toString() ?? '',
        dropWeight: prevSets[i]?.dropWeight?.toString() ?? '',
        dropReps: prevSets[i]?.dropReps?.toString() ?? '',
        restAfterSeconds: 90,
      }))
      setPendingSets(exercise.id, initial)
    }
  }, [loadingHistory, history, exercise.id, storePendingSets, targetSets, completedSets.length, setPendingSets])

  // Expande automáticamente el array de series pendientes si el número de series completadas crece,
  // pero SOLO si aún no se han completado todas las series efectivas objetivo.
  useEffect(() => {
    if (!storePendingSets) return
    const effectiveCompleted = completedSets.filter(s => s.setType === 'effective').length
    // No añadir fila extra si ya se completaron todas las series objetivo
    if (effectiveCompleted >= targetSets) return
    if (completedSets.length + 1 > storePendingSets.length) {
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
          restPauseReps: '',
          dropWeight: '',
          dropReps: '',
          restAfterSeconds: 90,
        })
      }
      setPendingSets(exercise.id, updated)
    }
  }, [completedSets.length, storePendingSets, exercise.id, history, setPendingSets, targetSets])

  // Carga la prescripción del Motor IA para este ejercicio
  useEffect(() => {
    if (!user || !exercise.id) return
    const loadRec = async () => {
      const res = await progressionService.getRecommendation(
        user.id,
        exercise.id,
        !!exercise.is_compound,
        weightUnit
      )
      if (res.data) {
        // Construir una ExercisePrescription mínima desde la respuesta del servicio
        // para alimentar al panel (generateWarmupSets se llama en el servicio completo,
        // aquí usamos los datos básicos disponibles)
        const { kgToLb } = await import('~/core/utils/epley')
        const { generateWarmupSets } = await import('~/services/ai-trainer.service')
        const numWarmups: 2 | 3 = res.data.isDeload ? 2 : 2
        const warmups = res.data.targetWeightKg > 0
          ? generateWarmupSets(res.data.targetWeightKg, weightUnit, numWarmups)
          : []
        const [repMin, repMax] = res.data.repRange.split('-').map(Number)
        const rirStr = res.data.rir.replace('RIR ', '')
        const [rirMin, rirMax] = rirStr.includes('-')
          ? rirStr.split('-').map(Number)
          : [parseInt(rirStr), parseInt(rirStr)]

        setPrescription({
          exerciseId: exercise.id,
          exerciseName: exercise.name_es ?? exercise.name,
          isCompound: !!exercise.is_compound,
          warmupSets: warmups,
          targetSets: res.data.setsCount,
          targetRepsMin: repMin ?? 8,
          targetRepsMax: repMax ?? 12,
          suggestedWeightKg: res.data.targetWeightKg,
          suggestedWeightLb: Math.round(kgToLb(res.data.targetWeightKg) / 2.5) * 2.5,
          displayWeight: res.data.displayWeight,
          targetRIRMin: rirMin ?? 2,
          targetRIRMax: rirMax ?? 3,
          allowRestPause: res.data.allowRestPause,
          allowDropset: res.data.allowDropset,
          prioritized: false,
          note: null,
        })
      }
    }
    loadRec()
  }, [user, exercise.id, exercise.is_compound, weightUnit])

  const addRow = () => {
    const nextIdx = pendingSets.length
    const lastPrev = prevSets[nextIdx]
    addPendingSetRow(exercise.id, {
      weight: lastPrev?.weight.toString() ?? '',
      reps: lastPrev?.reps.toString() ?? '',
      technique: 'normal',
      rir: 2,
      setType: 'effective',
      restPauseReps: '',
      dropWeight: '',
      dropReps: '',
      restAfterSeconds: 90,
    })
  }

  const handleComplete = async (rowIndex: number) => {
    const pending = pendingSets[rowIndex]
    if (!pending.weight || !pending.reps) return
    // Mejora 3: mínimo 1 rep
    const repsNum = parseInt(pending.reps)
    if (isNaN(repsNum) || repsNum < 1) return

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
      reps: repsNum,
      rirPerceived: pending.technique === 'failure' ? 0 : pending.rir,
      restAfterSeconds: pending.restAfterSeconds ?? 90,
      restPauseReps: pending.technique === 'rest_pause' && pending.restPauseReps ? parseInt(pending.restPauseReps) : undefined,
      dropWeight: pending.technique === 'drop_set' && pending.dropWeight ? parseFloat(pending.dropWeight) : undefined,
      dropReps: pending.technique === 'drop_set' && pending.dropReps ? parseInt(pending.dropReps) : undefined,
    })
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  // Label de anterior para cada fila
  const getPrevLabel = (rowIndex: number): string | null => {
    const prev = prevSets[rowIndex]
    if (!prev) return null
    
    let text = `${prev.weight} ${prev.weightUnit} × ${prev.reps}`
    if (prev.technique === 'failure') {
      text += ' (F)'
    } else if (prev.technique === 'rest_pause' && prev.restPauseReps) {
      text += ` (+${prev.restPauseReps} RP)`
    } else if (prev.technique === 'drop_set' && prev.dropWeight && prev.dropReps) {
      text += ` (↓ ${prev.dropWeight} × ${prev.dropReps} DS)`
    }
    return text
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl bg-card border border-border ${isDragging ? 'shadow-xl opacity-90' : ''
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
          {sessionEx?.notesText && (
            <div className="flex items-start gap-1.5 mt-1.5 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Info size={11} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-snug">{sessionEx.notesText}</p>
            </div>
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

          {/* Panel de prescripción del Motor IA */}
          {prescription && (
            <AIPrescriptionPanel
              prescription={prescription}
              weightUnit={weightUnit}
              applied={weightApplied}
              onApplyWeight={(weight) => {
                // Pre-llenar la primera serie efectiva pendiente que no tenga peso
                const firstEmptyIdx = pendingSets.findIndex(
                  (s, idx) => s.setType === 'effective' && !completedSets[idx] && !s.weight
                )
                const targetIdx = firstEmptyIdx >= 0 ? firstEmptyIdx : pendingSets.findIndex(
                  (s, idx) => s.setType === 'effective' && !completedSets[idx]
                )
                if (targetIdx >= 0) {
                  updatePendingSet(exercise.id, targetIdx, { weight: weight.toString() })
                  setWeightApplied(true)
                  // Reset tras 3 segundos para poder aplicar de nuevo
                  setTimeout(() => setWeightApplied(false), 3000)
                }
              }}
            />
          )}

          {/* Historial sesión anterior */}
          {showHistory && history && (
            <div className="p-3 mx-3 mb-2 space-y-1 border rounded-lg border-secondary/20 bg-secondary/5">
              <p className="text-xs font-medium text-secondary">
                {formatDateShort(history.sessionDate)}
                {history.sessionName && ` · ${history.sessionName}`}
              </p>
              {history.sets.filter(s => s.setType === 'effective').map((s, i) => {
                let techText = ''
                if (s.technique === 'failure') techText = ' (F)'
                else if (s.technique === 'rest_pause' && s.restPauseReps) techText = ` (+${s.restPauseReps} RP)`
                else if (s.technique === 'drop_set' && s.dropWeight && s.dropReps) techText = ` (↓ ${s.dropWeight} × ${s.dropReps} DS)`

                return (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">#{s.setNumber}</span>
                    <span className="font-mono text-foreground">
                      {s.weight} {s.weightUnit} × {s.reps}{techText}
                    </span>
                  </div>
                )
              })}
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

                  const effectiveIndex = completedSets
                    .slice(0, i)
                    .filter(s => s.setType === 'effective').length +
                    (pending.setType === 'effective' ? 1 : 0);

                  // Bug 1: un calentamiento solo puede aparecer antes de cualquier serie efectiva
                  const hasEffectiveBefore = pendingSets
                    .slice(0, i)
                    .some(s => s.setType === 'effective')
                  const canBeWarmup = !hasEffectiveBefore

                  return (
                    <SetRow
                      key={i}
                      index={i}
                      setNumber={pending.setType === 'warmup' ? 0 : effectiveIndex}
                      weightUnit={weightUnit}
                      completedSet={completed}
                      pendingSet={completed ? null : pending}
                      canBeWarmup={canBeWarmup}
                      onTapWeight={() => keyboard.openKeyboard({
                        key: `weight-${exercise.id}-${i}`,
                        value: completed ? (completed.weight?.toString() ?? '') : (pending.weight ?? ''),
                        label: `Peso — Serie ${i + 1}`,
                        decimal: true,
                        onCommit: (v) => {
                          if (completed) {
                            updateSetInStore(completed.id, { weight: parseFloat(v) || 0 })
                          } else {
                            updatePendingSet(exercise.id, i, { weight: v })
                          }
                        },
                      })}
                      onTapReps={() => keyboard.openKeyboard({
                        key: `reps-${exercise.id}-${i}`,
                        value: completed ? (completed.reps?.toString() ?? '') : (pending.reps ?? ''),
                        label: `Reps — Serie ${i + 1}`,
                        decimal: false,
                        onCommit: (v) => {
                          if (completed) {
                            updateSetInStore(completed.id, { reps: parseInt(v) || 0 })
                          } else {
                            updatePendingSet(exercise.id, i, { reps: v })
                          }
                        },
                      })}
                      onTapRpReps={() => keyboard.openKeyboard({
                        key: `rpReps-${exercise.id}-${i}`,
                        value: completed ? (completed.restPauseReps?.toString() ?? '') : (pending.restPauseReps ?? ''),
                        label: `Reps Rest-Pause — Serie ${i + 1}`,
                        decimal: false,
                        onCommit: (v) => {
                          if (completed) {
                            updateSetInStore(completed.id, { restPauseReps: parseInt(v) || undefined })
                          } else {
                            updatePendingSet(exercise.id, i, { restPauseReps: v })
                          }
                        },
                      })}
                      onTapDropWeight={() => keyboard.openKeyboard({
                        key: `dropWeight-${exercise.id}-${i}`,
                        value: completed ? (completed.dropWeight?.toString() ?? '') : (pending.dropWeight ?? ''),
                        label: `Peso Drop — Serie ${i + 1}`,
                        decimal: true,
                        onCommit: (v) => {
                          if (completed) {
                            updateSetInStore(completed.id, { dropWeight: parseFloat(v) || undefined })
                          } else {
                            updatePendingSet(exercise.id, i, { dropWeight: v })
                          }
                        },
                      })}
                      onTapDropReps={() => keyboard.openKeyboard({
                        key: `dropReps-${exercise.id}-${i}`,
                        value: completed ? (completed.dropReps?.toString() ?? '') : (pending.dropReps ?? ''),
                        label: `Reps Drop — Serie ${i + 1}`,
                        decimal: false,
                        onCommit: (v) => {
                          if (completed) {
                            updateSetInStore(completed.id, { dropReps: parseInt(v) || undefined })
                          } else {
                            updatePendingSet(exercise.id, i, { dropReps: v })
                          }
                        },
                      })}
                      onComplete={() => handleComplete(i)}
                      onDelete={() => {
                        if (completed) deleteSetFromStore(completed.id)
                        else removePendingSetRow(exercise.id, i)
                      }}
                      onUpdate={(updates) => {
                        if (completed) {
                          const activeUpdates: Partial<ActiveSet> = {}
                          if (updates.setType !== undefined) activeUpdates.setType = updates.setType
                          if (updates.technique !== undefined) activeUpdates.technique = updates.technique
                          if (updates.rir !== undefined) activeUpdates.rirPerceived = updates.rir
                          if (updates.restPauseReps !== undefined) activeUpdates.restPauseReps = updates.restPauseReps ? parseInt(updates.restPauseReps) : undefined
                          if (updates.dropWeight !== undefined) activeUpdates.dropWeight = updates.dropWeight ? parseFloat(updates.dropWeight) : undefined
                          if (updates.dropReps !== undefined) activeUpdates.dropReps = updates.dropReps ? parseInt(updates.dropReps) : undefined
                          updateSetInStore(completed.id, activeUpdates)
                        } else {
                          updatePendingSet(exercise.id, i, updates)
                        }
                      }}
                      prevLabel={getPrevLabel(i)}
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
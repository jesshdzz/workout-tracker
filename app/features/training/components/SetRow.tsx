import { useState } from 'react'
import { Trophy, Trash2, MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react'
import type { WeightUnit } from '~/core/types/common.types'
import type { ActiveSet, PendingSet } from '../store/session.store'

type Technique = 'normal' | 'rest_pause' | 'drop_set' | 'failure'

type Props = {
  index: number
  setNumber: number
  weightUnit: WeightUnit
  
  // Si está completado
  completedSet?: ActiveSet | null
  
  // Si está pendiente
  pendingSet?: PendingSet | null
  
  // Callbacks para teclados numéricos
  onTapWeight: () => void
  onTapReps: () => void
  onTapRpReps: () => void
  onTapDropWeight: () => void
  onTapDropReps: () => void
  
  onComplete: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<PendingSet>) => void
  
  prevLabel: string | null
}

export function SetRow({
  index,
  setNumber,
  weightUnit,
  completedSet,
  pendingSet,
  onTapWeight,
  onTapReps,
  onTapRpReps,
  onTapDropWeight,
  onTapDropReps,
  onComplete,
  onDelete,
  onUpdate,
  prevLabel,
}: Props) {
  const [showOptions, setShowOptions] = useState(false)

  const isCompleted = !!completedSet
  const currentSet = completedSet || pendingSet

  if (!currentSet) return null

  const weight = isCompleted ? completedSet.weight?.toString() : pendingSet?.weight
  const reps = isCompleted ? completedSet.reps?.toString() : pendingSet?.reps
  const technique = currentSet.technique as Technique
  const rir = isCompleted ? completedSet.rirPerceived : (pendingSet?.rir ?? 2)
  const setType = currentSet.setType
  const isPR = isCompleted && completedSet.isPR
  const restAfterSeconds = isCompleted ? 90 : (pendingSet?.restAfterSeconds ?? 90)

  // Campos específicos de técnicas
  const restPauseReps = isCompleted
    ? completedSet.restPauseReps?.toString()
    : pendingSet?.restPauseReps
  const dropWeight = isCompleted
    ? completedSet.dropWeight?.toString()
    : pendingSet?.dropWeight
  const dropReps = isCompleted
    ? completedSet.dropReps?.toString()
    : pendingSet?.dropReps

  const TECHNIQUES: { value: Technique; short: string; label: string }[] = [
    { value: 'normal', short: 'N', label: 'Normal' },
    { value: 'failure', short: 'F', label: 'Al fallo' },
    { value: 'rest_pause', short: 'RP', label: 'Rest-Pause' },
    { value: 'drop_set', short: 'DS', label: 'Drop-Set' },
  ]

  const REST_TIMES = [
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
  ]

  // Indicador visual de técnica avanzada en la fila compacta
  let techniqueBadge = null
  if (technique === 'failure') {
    techniqueBadge = <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/10 text-red-500 font-semibold uppercase">F</span>
  } else if (technique === 'rest_pause') {
    techniqueBadge = restPauseReps
      ? <span className="text-[10px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold font-mono">+{restPauseReps} RP</span>
      : <span className="text-[10px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold">RP</span>
  } else if (technique === 'drop_set') {
    techniqueBadge = (dropWeight && dropReps)
      ? <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-500 font-semibold font-mono">↓{dropWeight}kg×{dropReps} DS</span>
      : <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-500 font-semibold">DS</span>
  }

  return (
    <div className="transition-colors hover:bg-muted/10">
      {/* Fila compacta principal */}
      <div className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
        isCompleted ? 'bg-accent/5' : ''
      } ${isPR ? 'bg-primary/5' : ''}`}>
        
        {/* Tipo / Número de Serie */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-center w-7 shrink-0 flex items-center justify-center"
        >
          <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            setType === 'warmup'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : isCompleted
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-muted text-muted-foreground'
          }`}>
            {setType === 'warmup' ? 'W' : setNumber}
          </span>
        </button>

        {/* Anterior / Stats Previas */}
        <div className="flex-1 min-w-0" onClick={() => setShowOptions(!showOptions)}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs truncate text-muted-foreground">
              {prevLabel ?? '—'}
            </span>
            {techniqueBadge}
          </div>
        </div>

        {/* Botón Peso */}
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onTapWeight() }}
          className={`w-16 py-1.5 rounded-lg text-sm font-mono font-medium text-center transition-colors ${
            isCompleted
              ? 'bg-transparent text-foreground hover:bg-muted/20'
              : weight
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {weight || '—'}
        </button>

        {/* Botón Reps */}
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onTapReps() }}
          className={`w-14 py-1.5 rounded-lg text-sm font-mono font-medium text-center transition-colors ${
            isCompleted
              ? 'bg-transparent text-foreground hover:bg-muted/20'
              : reps
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {reps || '—'}
        </button>

        {/* Botón Completar / Título de PR */}
        <button
          type="button"
          onClick={isCompleted ? onDelete : onComplete}
          disabled={!isCompleted && (!weight || !reps)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? isPR
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground'
              : 'bg-muted text-muted-foreground disabled:opacity-30'
          }`}
        >
          {isCompleted ? (isPR ? <Trophy size={14} /> : '✓') : '✓'}
        </button>
      </div>

      {/* Panel de opciones expandible */}
      {showOptions && (
        <div className="px-4 py-3 space-y-3 bg-muted/20 border-t border-b border-border/40">
          {/* Toggles: Set Type + Rest Time */}
          <div className="flex gap-4 items-center justify-between">
            {/* Tipo de Serie */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tipo de serie</span>
              <div className="flex overflow-hidden text-xs border rounded-lg border-border">
                {(['warmup', 'effective'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                    onUpdate(
                      t === 'warmup'
                        // Al cambiar a calentamiento, resetear técnica y sus datos
                        // (las series de calentamiento no usan técnicas avanzadas)
                        ? { setType: t, technique: 'normal', restPauseReps: '', dropWeight: '', dropReps: '' }
                        : { setType: t }
                    )
                  }}
                    className={`px-3 py-1 font-medium transition-colors ${
                      setType === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t === 'warmup' ? 'Calent.' : 'Efectiva'}
                  </button>
                ))}
              </div>
            </div>

            {/* Descanso */}
            {!isCompleted && (
              <div className="space-y-1 text-right flex-1 flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tiempo descanso</span>
                <div className="flex gap-1">
                  {REST_TIMES.map((rt) => (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => onUpdate({ restAfterSeconds: rt.value })}
                      className={`px-2 py-1 rounded text-xs transition-colors font-medium ${
                        restAfterSeconds === rt.value
                          ? 'bg-secondary/20 text-secondary border border-secondary/30'
                          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selector de Técnica — solo para series efectivas */}
          {setType !== 'warmup' && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Técnica avanzada</span>
              <div className="flex gap-1 border border-border rounded-lg overflow-hidden bg-card p-0.5">
                {TECHNIQUES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => onUpdate({ technique: t.value })}
                    className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                      technique === t.value
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parámetros de Técnica Avanzada */}
          {setType !== 'warmup' && technique === 'rest_pause' && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Repeticiones Rest-Pause</span>
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onTapRpReps() }}
                className="w-full py-2 bg-card border border-border rounded-xl text-sm font-mono text-center hover:bg-muted/10 transition-colors"
              >
                {restPauseReps ? `+ ${restPauseReps} reps` : 'Toca para ingresar reps post-descanso'}
              </button>
            </div>
          )}

          {setType !== 'warmup' && technique === 'drop_set' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Peso Drop ({weightUnit})</span>
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); onTapDropWeight() }}
                  className="w-full py-2 bg-card border border-border rounded-xl text-sm font-mono text-center hover:bg-muted/10 transition-colors"
                >
                  {dropWeight ? `${dropWeight} ${weightUnit}` : 'Ingresar peso'}
                </button>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Reps Drop</span>
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); onTapDropReps() }}
                  className="w-full py-2 bg-card border border-border rounded-xl text-sm font-mono text-center hover:bg-muted/10 transition-colors"
                >
                  {dropReps ? `${dropReps} reps` : 'Ingresar reps'}
                </button>
              </div>
            </div>
          )}

          {/* RIR — solo para series efectivas y no al fallo */}
          {setType !== 'warmup' && technique !== 'failure' && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">RIR percibido (Reps en Reserva)</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onUpdate({ rir: r })}
                    className={`flex-1 py-1 rounded text-xs font-semibold font-mono border transition-colors ${
                      rir === r
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    RIR {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controles del Set */}
          <div className="flex justify-between items-center pt-1 gap-2">
            <button
              type="button"
              onClick={() => setShowOptions(false)}
              className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-card hover:bg-muted/30 border border-border rounded-lg"
            >
              Cerrar opciones
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete()
                setShowOptions(false)
              }}
              className="px-3 py-2 text-xs border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors rounded-lg flex items-center justify-center gap-1"
            >
              <Trash2 size={12} />
              Eliminar serie
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

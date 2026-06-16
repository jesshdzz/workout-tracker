// app/features/training/components/AIPrescriptionPanel.tsx
//
// Panel de prescripción del Motor IA para cada ejercicio en sesión activa.
// Muestra el peso objetivo, series de aproximación, rango de reps y RIR.
// El botón "Usar" pre-llena el campo de peso en la primera serie pendiente.

import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, Zap, AlertTriangle, Check } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { ExercisePrescription } from '~/services/ai-trainer.service'

type Props = {
  prescription: ExercisePrescription
  weightUnit: 'kg' | 'lb'
  /** Callback para pre-llenar el peso en la primera serie pendiente */
  onApplyWeight: (weight: number) => void
  applied: boolean
}

const TECHNIQUE_LABELS: Record<string, string> = {
  rest_pause: 'Rest-Pause',
  drop_set: 'Drop-Set',
}

const RIR_COLOR: Record<number, string> = {
  0: 'text-red-400',
  1: 'text-orange-400',
  2: 'text-amber-400',
  3: 'text-emerald-400',
  4: 'text-blue-400',
}

export function AIPrescriptionPanel({ prescription, weightUnit, onApplyWeight, applied }: Props) {
  const [showWarmup, setShowWarmup] = useState(false)

  const targetWeight = weightUnit === 'kg'
    ? prescription.suggestedWeightKg
    : prescription.suggestedWeightLb
  const altWeight = weightUnit === 'kg'
    ? prescription.suggestedWeightLb
    : prescription.suggestedWeightKg
  const altUnit = weightUnit === 'kg' ? 'lb' : 'kg'

  const rirLabel = prescription.targetRIRMin === prescription.targetRIRMax
    ? `RIR ${prescription.targetRIRMin}`
    : `RIR ${prescription.targetRIRMin}–${prescription.targetRIRMax}`

  const rirColor = RIR_COLOR[prescription.targetRIRMin] ?? 'text-primary'

  const hasWarmup = prescription.warmupSets.length > 0
  const techniques = [
    prescription.allowRestPause && 'rest_pause',
    prescription.allowDropset && 'drop_set',
  ].filter(Boolean) as string[]

  return (
    <div className={cn(
      'mx-3 mb-2 rounded-xl border overflow-hidden',
      prescription.prioritized
        ? 'border-primary/30 bg-primary/5'
        : 'border-border bg-muted/30',
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        <Brain size={13} className="text-primary shrink-0" />
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wide flex-1">
          Motor IA
        </p>
        {prescription.prioritized && (
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
            ★ Prioridad
          </span>
        )}
      </div>

      {/* Prescripción principal */}
      <div className="px-3 py-2.5 space-y-2.5">

        {/* Peso sugerido + reps + RIR */}
        <div className="flex items-center gap-2">
          {/* Peso */}
          <div className="flex-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-foreground tabular-nums">
              {targetWeight}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{weightUnit}</span>
            {altWeight > 0 && (
              <span className="text-xs text-muted-foreground">
                ({altWeight} {altUnit})
              </span>
            )}
          </div>

          {/* Objetivo: sets × reps */}
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">
              {prescription.targetSets}×{prescription.targetRepsMin}–{prescription.targetRepsMax}
              <span className="text-xs font-normal text-muted-foreground ml-1">reps</span>
            </p>
            <p className={cn('text-xs font-semibold', rirColor)}>{rirLabel}</p>
          </div>
        </div>

        {/* Nota de seguridad (ej: RDL no al fallo) */}
        {prescription.note && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
            <AlertTriangle size={11} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-400">{prescription.note}</p>
          </div>
        )}

        {/* Técnicas permitidas */}
        {techniques.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[10px] text-muted-foreground">Técnicas:</p>
            {techniques.map(t => (
              <span
                key={t}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {TECHNIQUE_LABELS[t]}
              </span>
            ))}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Botón aplicar peso */}
          <button
            type="button"
            onClick={() => onApplyWeight(targetWeight)}
            disabled={applied || targetWeight === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              applied
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : targetWeight === 0
                  ? 'bg-muted border-border text-muted-foreground opacity-50 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
            )}
          >
            {applied ? (
              <>
                <Check size={11} />
                Aplicado
              </>
            ) : (
              <>
                <Zap size={11} />
                Usar {targetWeight} {weightUnit}
              </>
            )}
          </button>

          {/* Toggle aproximaciones */}
          {hasWarmup && (
            <button
              type="button"
              onClick={() => setShowWarmup(v => !v)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors"
            >
              Aprox. ({prescription.warmupSets.length})
              {showWarmup ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>
      </div>

      {/* Series de aproximación */}
      {showWarmup && hasWarmup && (
        <div className="border-t border-border/50 divide-y divide-border/30">
          {prescription.warmupSets.map((ws, i) => {
            const display = weightUnit === 'kg'
              ? `${ws.weightKg} kg`
              : `${ws.weightLb} lb`
            return (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground w-5">A{i + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(ws.intensityPct * 100)}% del objetivo
                  </span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs font-medium text-foreground">{display}</span>
                  <span className="text-xs text-muted-foreground">{ws.reps} reps</span>
                </div>
              </div>
            )
          })}
          <div className="px-3 py-1.5">
            <p className="text-[10px] text-muted-foreground">
              Las series de aproximación NO se registran como series efectivas.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

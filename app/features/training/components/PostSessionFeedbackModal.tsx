// app/features/training/components/PostSessionFeedbackModal.tsx
//
// Modal de feedback post-entreno — aparece al guardar la sesión.
// Captura: RPE global, dificultad percibida, progreso percibido,
// fatiga excesiva, notas libres, y cardio completado (con todos sus parámetros).
// El Motor IA usa esto para ajustar bloques futuros y detectar patrones.

import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Flame, TrendingUp, Heart, Bike, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { PerceivedDifficulty, PerceivedProgress } from '~/repositories/post-session-feedback.repository'

type Props = {
  sessionId: string
  cardioPrescribed: {
    duration_min: number
    speed_kmh: number
    incline_pct: number
  } | null
  onSave: (feedback: FeedbackPayload) => Promise<void>
  onSkip: () => void
}

export type FeedbackPayload = {
  sessionId: string
  rpeGlobal: number
  perceivedDifficulty: PerceivedDifficulty
  perceivedProgress: PerceivedProgress
  excessiveFatigueFlag: boolean
  notes: string
  cardioCompleted: boolean
  cardioDurationMin: number | null
  cardioSpeedKmh: number | null
  cardioInclinePct: number | null
}

type DifficultyOption = { value: PerceivedDifficulty; label: string; emoji: string; color: string }
type ProgressOption = { value: PerceivedProgress; label: string; emoji: string }

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 'too_easy',        label: 'Muy fácil',          emoji: '😴', color: 'border-blue-400/60 bg-blue-400/10 text-blue-400' },
  { value: 'perfect',         label: 'Perfecto',           emoji: '💪', color: 'border-emerald-400/60 bg-emerald-400/10 text-emerald-400' },
  { value: 'hard_but_doable', label: 'Duro pero lograble', emoji: '🔥', color: 'border-amber-400/60 bg-amber-400/10 text-amber-400' },
  { value: 'too_much',        label: 'Demasiado',          emoji: '💀', color: 'border-red-400/60 bg-red-400/10 text-red-400' },
]

const PROGRESS_OPTIONS: ProgressOption[] = [
  { value: 'clearly_progressing', label: 'Claramente progresando', emoji: '🚀' },
  { value: 'maintaining',         label: 'Manteniendo',             emoji: '➡️' },
  { value: 'stalled',             label: 'Estancado',               emoji: '😐' },
  { value: 'regressing',          label: 'Retrocediendo',           emoji: '📉' },
]

const RPE_LABELS: Record<number, string> = {
  1: 'Muy ligero', 2: 'Ligero', 3: 'Moderado', 4: 'Moderado+',
  5: 'Fuerte', 6: 'Fuerte+', 7: 'Muy fuerte', 8: 'Casi máximo',
  9: 'Máximo', 10: 'Absoluto',
}

function RPESelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-primary" />
          <p className="text-xs font-medium text-foreground">Esfuerzo percibido (RPE)</p>
        </div>
        <span className="text-xs font-bold text-primary">
          RPE {value} — {RPE_LABELS[value]}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const color = n <= 5
            ? 'bg-emerald-500'
            : n <= 7
              ? 'bg-amber-500'
              : n <= 9
                ? 'bg-orange-500'
                : 'bg-red-500'
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all',
                value === n
                  ? `${color} text-white border-transparent`
                  : 'bg-muted border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CardioSection({
  prescribed,
  completed,
  durationMin,
  speedKmh,
  inclinePct,
  onToggle,
  onChange,
}: {
  prescribed: Props['cardioPrescribed']
  completed: boolean
  durationMin: string
  speedKmh: string
  inclinePct: string
  onToggle: (v: boolean) => void
  onChange: (field: 'duration' | 'speed' | 'incline', val: string) => void
}) {
  return (
    <div className="p-3 space-y-3 border rounded-xl border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bike size={14} className="text-primary" />
          <p className="text-xs font-medium text-foreground">Cardio post-entreno</p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!completed)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-all',
            completed
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted border-border text-muted-foreground',
          )}
        >
          {completed ? '✓ Completado' : 'No hice cardio'}
        </button>
      </div>

      {prescribed && !completed && (
        <p className="text-[11px] text-amber-500/80">
          Motor IA prescribió: {prescribed.duration_min} min · {prescribed.speed_kmh} km/h · {prescribed.incline_pct}° inclinación
        </p>
      )}

      {completed && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Minutos', field: 'duration' as const, value: durationMin, placeholder: prescribed?.duration_min?.toString() ?? '20' },
            { label: 'km/h', field: 'speed' as const, value: speedKmh, placeholder: prescribed?.speed_kmh?.toString() ?? '4' },
            { label: '° Inclinación', field: 'incline' as const, value: inclinePct, placeholder: prescribed?.incline_pct?.toString() ?? '20' },
          ].map(({ label, field, value, placeholder }) => (
            <div key={field} className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => onChange(field, e.target.value)}
                placeholder={placeholder}
                inputMode="decimal"
                className="w-full px-2 py-1.5 rounded-lg bg-muted border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PostSessionFeedbackModal({ sessionId, cardioPrescribed, onSave, onSkip }: Props) {
  const [rpe, setRpe] = useState(7)
  const [difficulty, setDifficulty] = useState<PerceivedDifficulty>('perfect')
  const [progress, setProgress] = useState<PerceivedProgress>('maintaining')
  const [excessiveFatigue, setExcessiveFatigue] = useState(false)
  const [notes, setNotes] = useState('')
  const [cardioCompleted, setCardioCompleted] = useState(false)
  const [cardioDuration, setCardioDuration] = useState('')
  const [cardioSpeed, setCardioSpeed] = useState('')
  const [cardioIncline, setCardioIncline] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      sessionId,
      rpeGlobal: rpe,
      perceivedDifficulty: difficulty,
      perceivedProgress: progress,
      excessiveFatigueFlag: excessiveFatigue,
      notes,
      cardioCompleted,
      cardioDurationMin: cardioCompleted && cardioDuration ? parseInt(cardioDuration) : null,
      cardioSpeedKmh: cardioCompleted && cardioSpeed ? parseFloat(cardioSpeed) : null,
      cardioInclinePct: cardioCompleted && cardioIncline ? parseFloat(cardioIncline) : null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center z-[70] sm:items-center bg-foreground/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-foreground">¿Cómo fue el entreno?</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tu respuesta entrena al Motor IA para ajustar tus próximas sesiones
          </p>
        </div>

        {/* Scrollable content */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">

          {/* RPE */}
          <RPESelector value={rpe} onChange={setRpe} />

          {/* Dificultad percibida */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-primary" />
              <p className="text-xs font-medium text-foreground">¿Cómo te resultó la carga?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDifficulty(opt.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all text-xs font-medium',
                    difficulty === opt.value ? opt.color : 'bg-muted border-border text-muted-foreground hover:border-primary/20',
                  )}
                >
                  <span className="text-base">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progreso percibido */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <p className="text-xs font-medium text-foreground">¿Ves progreso?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PROGRESS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProgress(opt.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-xs font-medium',
                    progress === opt.value
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:border-primary/20',
                  )}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fatiga excesiva */}
          <button
            type="button"
            onClick={() => setExcessiveFatigue(v => !v)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left',
              excessiveFatigue
                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                : 'bg-muted border-border text-muted-foreground hover:border-primary/20',
            )}
          >
            <Heart size={14} className={excessiveFatigue ? 'text-red-400' : 'text-muted-foreground'} />
            <div>
              <p>Fatiga excesiva o inusual</p>
              <p className="text-[10px] opacity-70 mt-0.5">
                Activa esto si te sientes más agotado de lo normal o tienes señales de sobreentrenamiento
              </p>
            </div>
            {excessiveFatigue && <span className="ml-auto text-red-400">✓</span>}
          </button>

          {/* Cardio */}
          <CardioSection
            prescribed={cardioPrescribed}
            completed={cardioCompleted}
            durationMin={cardioDuration}
            speedKmh={cardioSpeed}
            inclinePct={cardioIncline}
            onToggle={setCardioCompleted}
            onChange={(field, val) => {
              if (field === 'duration') setCardioDuration(val)
              if (field === 'speed') setCardioSpeed(val)
              if (field === 'incline') setCardioIncline(val)
            }}
          />

          {/* Notas libres (colapsable) */}
          <div>
            <button
              type="button"
              onClick={() => setShowNotes(v => !v)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare size={13} />
              Agregar notas
              {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showNotes && (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej: Sentí debilidad en el manguito rotador, aumenté el peso en curl..."
                rows={3}
                className="mt-2 w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onSkip}>
            Saltar
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar feedback'}
          </Button>
        </div>
      </div>
    </div>
  )
}

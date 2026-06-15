// app/features/training/components/PreFlightCheckin.tsx
//
// Modal de check-in pre-entreno — aparece al iniciar la primera sesión del día.
// 10 segundos de interacción: sueño, estrés percibido, dolor muscular.
// El Motor IA usa estos datos para ajustar el volumen y las técnicas de la sesión.

import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Moon, Zap, Dumbbell, X } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { CheckinInput } from '~/services/ai-trainer.service'

type Props = {
  onSubmit: (checkin: CheckinInput) => void
  onSkip: () => void
}

type SliderField = 'sleep_hours' | 'stress_level' | 'muscle_soreness'

const SLEEP_OPTIONS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

function SleepSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Moon size={14} className="text-primary" />
        <p className="text-xs font-medium text-foreground">Horas de sueño anoche</p>
        <span className="ml-auto text-xs font-bold text-primary">{value}h</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {SLEEP_OPTIONS.map(h => (
          <button
            key={h}
            type="button"
            onClick={() => onChange(h)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
              value === h
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted border-border text-muted-foreground hover:border-primary/40',
            )}
          >
            {h}h
          </button>
        ))}
      </div>
      {value < 6 && (
        <p className="text-[11px] text-amber-500">
          ⚠️ Menos de 6h. El motor reducirá el volumen de hoy para proteger tu recuperación.
        </p>
      )}
    </div>
  )
}

function ScaleSelector({
  value,
  onChange,
  labels,
  colorFn,
}: {
  value: number
  onChange: (v: number) => void
  labels: [string, string]
  colorFn: (v: number) => string
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'flex-1 py-3 rounded-xl text-sm font-bold border transition-all',
            value === n
              ? `${colorFn(n)} border-transparent text-white`
              : 'bg-muted border-border text-muted-foreground hover:border-primary/40',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function stressColor(v: number): string {
  const colors: Record<number, string> = {
    1: 'bg-emerald-500',
    2: 'bg-green-500',
    3: 'bg-amber-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
  }
  return colors[v] ?? 'bg-primary'
}

function sorenessColor(v: number): string {
  const colors: Record<number, string> = {
    1: 'bg-emerald-500',
    2: 'bg-green-500',
    3: 'bg-amber-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
  }
  return colors[v] ?? 'bg-primary'
}

const STRESS_LABELS: [string, string] = ['Sin estrés', 'Muy estresado']
const SORENESS_LABELS: [string, string] = ['Sin dolor', 'Muy adolorido']

// Describe el impacto al usuario según la combinación de valores
function getMotorPreview(sleep: number, stress: number, soreness: number): {
  label: string
  color: string
  description: string
} {
  const score = Math.min(50, (sleep / 8) * 50)
    + ((5 - stress) / 4) * 25
    + ((5 - soreness) / 4) * 25

  if (score < 40) return {
    label: 'Sesión de técnica',
    color: 'text-red-500',
    description: 'Series reducidas a la mitad. Sin técnicas avanzadas.',
  }
  if (score < 55) return {
    label: 'Volumen reducido',
    color: 'text-amber-500',
    description: '−1 serie en compuestos. Sin Rest-Pause ni Drop-Set.',
  }
  if (score < 70) return {
    label: 'Sin técnicas avanzadas',
    color: 'text-yellow-500',
    description: 'Volumen completo. Sin Rest-Pause ni Drop-Set hoy.',
  }
  return {
    label: 'Sesión completa ✓',
    color: 'text-emerald-500',
    description: 'Recuperación óptima. Sesión completa con todas las técnicas.',
  }
}

export function PreFlightCheckin({ onSubmit, onSkip }: Props) {
  const [sleep, setSleep] = useState(7.5)
  const [stress, setStress] = useState(2)
  const [soreness, setSoreness] = useState(2)

  const preview = getMotorPreview(sleep, stress, soreness)

  const handleSubmit = () => {
    onSubmit({
      sleep_hours: sleep,
      stress_level: stress,
      muscle_soreness: soreness,
    })
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center z-[70] sm:items-center bg-foreground/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">¿Cómo te sientes hoy?</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                El Motor IA ajustará tu sesión automáticamente
              </p>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Saltar check-in"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="px-5 py-4 space-y-5">

          {/* Sueño */}
          <SleepSelector value={sleep} onChange={setSleep} />

          {/* Estrés */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              <p className="text-xs font-medium text-foreground">Nivel de estrés</p>
              <div className="ml-auto flex gap-2 text-[10px] text-muted-foreground">
                <span>1 = ninguno</span>
                <span>5 = máximo</span>
              </div>
            </div>
            <ScaleSelector
              value={stress}
              onChange={setStress}
              labels={STRESS_LABELS}
              colorFn={stressColor}
            />
          </div>

          {/* Dolor muscular */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Dumbbell size={14} className="text-primary" />
              <p className="text-xs font-medium text-foreground">Dolor / agujetas muscular</p>
              <div className="ml-auto flex gap-2 text-[10px] text-muted-foreground">
                <span>1 = ninguno</span>
                <span>5 = mucho</span>
              </div>
            </div>
            <ScaleSelector
              value={soreness}
              onChange={setSoreness}
              labels={SORENESS_LABELS}
              colorFn={sorenessColor}
            />
          </div>

          {/* Preview del motor */}
          <div className="px-3 py-2.5 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <p className="text-xs text-muted-foreground">Motor IA → </p>
              <p className={cn('text-xs font-semibold', preview.color)}>{preview.label}</p>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{preview.description}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onSkip}>
            Saltar
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            Empezar sesión
          </Button>
        </div>
      </div>
    </div>
  )
}

// app/features/profile/components/UserMetricsForm.tsx
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Brain, Moon, Dumbbell,
  ChevronDown, ChevronUp, CheckCircle2, Scale, Target, Zap, BicepsFlexed, Flame, TriangleAlert,
  ToggleLeft, ToggleRight, CalendarDays,
} from 'lucide-react'
import { useUserMetrics } from '../hooks/useUserMetrics'
import type { UserGoals } from '~/repositories/user-metrics.repository'
import { cn } from '~/lib/utils'

// ── Catálogo de músculos (slugs y etiquetas en español)
const MUSCLE_LIST = [
  { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'forearms', label: 'Antebrazos' },
  { id: 'rear_deltoid', label: 'Deltoides posterior' },
  { id: 'lateral_deltoid', label: 'Deltoides lateral' },
  { id: 'front_deltoid', label: 'Deltoides anterior' },
  { id: 'upper_chest', label: 'Pectoral superior' },
  { id: 'lower_chest', label: 'Pectoral inferior' },
  { id: 'lats', label: 'Dorsales' },
  { id: 'traps', label: 'Trapecios' },
  { id: 'calves', label: 'Pantorrillas' },
  { id: 'quads', label: 'Cuádriceps' },
  { id: 'hamstrings', label: 'Isquiosurales' },
  { id: 'glutes', label: 'Glúteos' },
  { id: 'abs', label: 'Abdominales' },
]

const SOMATOTYPES = [
  { value: 'ectomorph', label: 'Ectomorfo', desc: 'Delgado, metabolismo rápido, difícil ganar masa' },
  { value: 'ecto-meso', label: 'Ecto-Meso', desc: 'Delgado con tendencia atlética' },
  { value: 'mesomorph', label: 'Mesomorfo', desc: 'Atlético, gana músculo y pierde grasa con facilidad' },
  { value: 'endo-meso', label: 'Endo-Meso', desc: 'Tendencia a ganar músculo y grasa' },
  { value: 'endomorph', label: 'Endomorfo', desc: 'Tendencia a acumular grasa, recuperación lenta' },
]

const DIET_OPTIONS = [
  { value: 'surplus', label: 'Superávit', desc: '+300-500 kcal sobre mantenimiento' },
  { value: 'maintenance', label: 'Mantenimiento', desc: 'Calorías iguales al gasto diario' },
  { value: 'deficit', label: 'Déficit', desc: '-300-500 kcal bajo mantenimiento' },
]

const GOAL_OPTIONS: { key: keyof UserGoals; label: string; icon: React.ReactNode }[] = [
  { key: 'build_muscle', label: 'Ganar músculo', icon: <BicepsFlexed width={16} height={16} /> },
  { key: 'lose_fat', label: 'Perder grasa', icon: <Flame width={16} height={16} /> },
  { key: 'increase_strength', label: 'Aumentar fuerza', icon: <Zap width={16} height={16} /> },
  { key: 'maintain_bf_range', label: 'Mantener % grasa', icon: <Scale width={16} height={16} /> },
]

// ── Subcomponent: section header
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 rounded-lg bg-primary/10">
        <Icon size={14} className="text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
  )
}

// ── Subcomponent: input field
function MetricInput({
  label, value, onChange, placeholder, type = 'number', suffix,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; suffix?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={type === 'number' ? 'decimal' : undefined}
          className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm pr-10"
        />
        {suffix && (
          <span className="absolute text-xs -translate-y-1/2 right-3 top-1/2 text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  )
}

// ── Subcomponent: pill selector
function PillOption({
  selected, onClick, label,
}: {
  selected: boolean; onClick: () => void; label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

export function UserMetricsForm() {
  const {
    form, loading, saving, saved, error,
    updateField, toggleMuscle, toggleGoal, saveMetrics,
  } = useUserMetrics()

  const [showMuscles, setShowMuscles] = useState(false)

  if (loading) return null

  const isComplete = form.weight_kg && form.height_cm && form.somatotype && form.diet_status

  return (
    <div className="p-4 space-y-6 border rounded-2xl bg-card border-border">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">Perfil del Atleta</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            La app usa estos datos para personalizar tu programa
          </p>
        </div>
        {isComplete && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-500 font-medium">Completo</span>
          </div>
        )}
      </div>

      {error && (
        <p className="px-3 py-2 text-xs border rounded-xl bg-destructive/10 border-destructive/20 text-destructive">
          {error}
        </p>
      )}

      {/* ── Sección: Unidad de Peso */}
      <div>
        <SectionHeader icon={Scale} title="Unidad de peso preferida" />
        <div className="flex gap-2">
          {(['kg', 'lb'] as const).map(u => (
            <button
              key={u}
              type="button"
              onClick={() => updateField('weight_unit', u)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                form.weight_unit === u
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-amber-500/80">
          <div className="flex items-center">
            <TriangleAlert width={16} height={16} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            La app usa esto para calcular incrementos mínimos viables al subir peso (ej. mínimo 1.25 kg o 2.5 lb)
          </p>

        </div>
      </div>

      {/* ── Sección: Medidas corporales */}
      <div>
        <SectionHeader icon={Dumbbell} title="Medidas corporales" />
        <div className="grid grid-cols-2 gap-3">
          <MetricInput
            label="Peso"
            value={form.weight_kg}
            onChange={v => updateField('weight_kg', v)}
            placeholder="80"
            suffix={form.weight_unit}
          />
          <MetricInput
            label="Altura"
            value={form.height_cm}
            onChange={v => updateField('height_cm', v)}
            placeholder="170"
            suffix="cm"
          />
          <MetricInput
            label="% Grasa corporal"
            value={form.body_fat_pct}
            onChange={v => updateField('body_fat_pct', v)}
            placeholder="15"
            suffix="%"
          />
          <MetricInput
            label="Años entrenando"
            value={form.experience_years}
            onChange={v => updateField('experience_years', v)}
            placeholder="5"
            suffix="años"
          />
        </div>
      </div>

      {/* ── Sección: Somatotipo */}
      <div>
        <SectionHeader icon={Target} title="Tipo corporal (somatotipo)" />
        <div className="space-y-2">
          {SOMATOTYPES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => updateField('somatotype', s.value)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-2',
                form.somatotype === s.value
                  ? 'bg-primary/10 border-primary/40 text-foreground'
                  : 'bg-muted border-border text-muted-foreground hover:border-primary/20',
              )}
            >
              <div>
                <p className={cn('text-xs font-semibold', form.somatotype === s.value ? 'text-primary' : 'text-foreground')}>
                  {s.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              {form.somatotype === s.value && <CheckCircle2 size={14} className="text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sección: Objetivos (metas híbridas) */}
      <div>
        <SectionHeader icon={Zap} title="Objetivos (puedes seleccionar varios)" />
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map(({ key, label, icon }) => {
            const active = form.goals[key] === true
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleGoal(key, !active)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                  active
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-muted border-border hover:border-primary/20',
                )}
              >
                <div className="p-1 text-amber-500">{icon}</div>
                <span className={cn('text-xs font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Sección: Recuperación y dieta */}
      <div>
        <SectionHeader icon={Moon} title="Recuperación y nutrición" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <MetricInput
            label="Horas de sueño (promedio)"
            value={form.avg_sleep_hours}
            onChange={v => updateField('avg_sleep_hours', v)}
            placeholder="7.5"
            suffix="h"
          />
          <MetricInput
            label="Hidratación diaria"
            value={form.hydration_liters}
            onChange={v => updateField('hydration_liters', v)}
            placeholder="3"
            suffix="L"
          />
          <div className="col-span-2">
            <MetricInput
              label="Proteína diaria objetivo"
              value={form.daily_protein_g}
              onChange={v => updateField('daily_protein_g', v)}
              placeholder="160"
              suffix="g"
            />
          </div>
        </div>

        {/* Dieta */}
        <p className="mb-2 text-xs text-muted-foreground">Estado calórico actual</p>
        <div className="space-y-2">
          {DIET_OPTIONS.map(d => (
            <button
              key={d.value}
              type="button"
              onClick={() => updateField('diet_status', d.value)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-xl border transition-all flex items-center justify-between',
                form.diet_status === d.value
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-muted border-border hover:border-primary/20',
              )}
            >
              <div>
                <p className={cn('text-xs font-semibold', form.diet_status === d.value ? 'text-primary' : 'text-foreground')}>
                  {d.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{d.desc}</p>
              </div>
              {form.diet_status === d.value && <CheckCircle2 size={13} className="text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sección: Músculos rezagados */}
      <div>
        <button
          type="button"
          onClick={() => setShowMuscles(v => !v)}
          className="flex items-center justify-between w-full"
        >
          <SectionHeader icon={Dumbbell} title="Músculos rezagados (puntos débiles)" />
          {showMuscles ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>

        {showMuscles && (
          <div className="mt-2 space-y-4">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Músculos rezagados que necesitan más atención</p>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_LIST.map(m => (
                  <PillOption
                    key={m.id}
                    label={m.label}
                    selected={form.weak_muscles.includes(m.id)}
                    onClick={() => toggleMuscle('weak_muscles', m.id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Músculos a priorizar en el programa</p>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_LIST.map(m => (
                  <PillOption
                    key={m.id}
                    label={m.label}
                    selected={form.priority_muscles.includes(m.id)}
                    onClick={() => toggleMuscle('priority_muscles', m.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sección: Plan de periodización */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => updateField('use_periodization', !form.use_periodization)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
            <CalendarDays size={14} className="text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Plan de periodización</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {form.use_periodization
                ? 'Activo — la app guía tus pesos, check-ins y progresión semana a semana'
                : 'Desactivado — llevas tu propio registro sin guía de progresión'}
            </p>
          </div>
          {form.use_periodization
            ? <ToggleRight size={28} className="text-primary shrink-0" />
            : <ToggleLeft size={28} className="text-muted-foreground shrink-0" />
          }
        </button>

        {!form.use_periodization && (
          <div className="flex items-start gap-2 px-4 py-3 border-t border-border bg-amber-400/5">
            <TriangleAlert size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Sin periodización, no aparecerán sugerencias de peso, check-in pre-entreno
              ni análisis de progresión. Podrás reactivarla en cualquier momento.
            </p>
          </div>
        )}
      </div>

      {/* ── Botón guardar */}
      <Button
        onClick={saveMetrics}
        disabled={saving || !isComplete}
        className="w-full"
        variant={saved ? 'outline' : 'default'}
      >
        {saving
          ? 'Guardando...'
          : saved
            ? '✓ Guardado'
            : 'Guardar perfil del atleta'}
      </Button>

      {!isComplete && (
        <p className="text-[11px] text-center text-amber-500/80">
          Completa al menos: peso, altura, somatotipo y estado calórico para que la App funcione correctamente.
        </p>
      )}
    </div>
  )
}

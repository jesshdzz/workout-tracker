// Wizard guiado de calibración de RMs — Semana 0.
// Pantalla completa que aparece la primera vez que el usuario accede al entrenamiento
// después de completar su perfil de atleta.
//
// Flujo: Intro → Sesión 1 (Upper) → Between → Sesión 2 (Lower) → Resumen → Done

import { useState } from 'react'
import { Brain, ChevronRight, ChevronLeft, Zap, AlertTriangle, Check, Lock, TrendingUp, Weight } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { calcWorkingWeight } from '~/core/utils/epley'
import { getBlockConfig } from '~/core/utils/periodization'
import { useRMTest, type RMEntry } from './useRMTest'

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: pantalla de introducción
// ─────────────────────────────────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-3xl bg-primary/10">
          <Brain size={36} className="text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Calibración de tu fuerza</h1>
          <p className="text-sm text-muted-foreground">
            Antes de comenzar las 16 semanas, la app necesita conocer tu fuerza base real.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {[
            {
              icon: '📋',
              title: '2 sesiones de calibración',
              desc: 'Sesión 1: tren superior (Upper). Sesión 2: tren inferior (Lower).',
            },
            {
              icon: '🔢',
              title: 'Registra peso + repeticiones',
              desc: 'La app calcula tu 1RM estimado automáticamente con la fórmula de Epley.',
            },
            {
              icon: '🎯',
              title: 'Prescripciones exactas desde el Día 1',
              desc: 'Con tus RMs, la app sabrá exactamente cuánto peso usar cada semana.',
            },
            {
              icon: '⚡',
              title: 'No es un test de máximos',
              desc: 'No llegas al fallo. Elige un peso con el que puedas hacer 6-15 reps con buena técnica.',
            },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3 px-4 py-3 border rounded-xl bg-muted border-border">
              <span className="text-xl leading-none mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border rounded-xl bg-amber-400/10 border-amber-400/20">
          <p className="text-xs font-medium text-amber-400">
            💡 Tómate 1-2 días de descanso entre las 2 sesiones para llegar fresco.
          </p>
        </div>

        <Button className="w-full h-12 text-base" onClick={onStart}>
          Comenzar Sesión 1 — Upper
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: card de ejercicio individual
// ─────────────────────────────────────────────────────────────────────────────
function ExerciseCard({
  entry,
  index,
  totalExercises,
  sessionPhase,
  onChange,
}: {
  entry: RMEntry
  index: number
  totalExercises: number
  sessionPhase: 'session-1' | 'session-2'
  onChange: (field: 'weightUsed' | 'repsCompleted' | 'bodyweightKg', value: string) => void
}) {
  const hasRM = entry.calculatedRM !== null && entry.calculatedRM > 0
  const week1Config = getBlockConfig(1)
  const prescribedKg = hasRM
    ? calcWorkingWeight(entry.calculatedRM!, week1Config.intensityPct, 'kg')
    : null
  const prescribedLb = prescribedKg ? Math.round(prescribedKg * 2.2046 / 2.5) * 2.5 : null

  return (
    <div className="overflow-hidden border bg-card border-border rounded-2xl">
      {/* Progress bar */}
      <div className="h-0.5 bg-muted">
        <div
          className="h-full transition-all bg-primary"
          style={{ width: `${((index + 1) / totalExercises) * 100}%` }}
        />
      </div>

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {index + 1} / {totalExercises}
              </span>
              {entry.isCompound && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Compuesto
                </span>
              )}
            </div>
            <h2 className="text-base font-bold leading-tight text-foreground">{entry.nameEs}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rango sugerido: {entry.repRangeMin}–{entry.repRangeMax} reps
            </p>
          </div>
        </div>

        {/* Nota de seguridad */}
        {entry.safetyNote && (
          <div className={cn(
            'flex items-start gap-2 px-3 py-2 rounded-xl border text-xs',
            entry.safetyNote.includes('⚠️')
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-amber-400/10 border-amber-400/20 text-amber-400',
          )}>
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <p>{entry.safetyNote}</p>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-3">
          {entry.bodyweightOnly ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tu peso corporal (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={entry.bodyweightKg ?? ''}
                onChange={e => onChange('bodyweightKg', e.target.value)}
                placeholder="Ej: 80"
                className="w-full px-4 py-3 text-base font-medium border rounded-xl bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Peso usado en el test
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={entry.weightUsed}
                  onChange={e => onChange('weightUsed', e.target.value)}
                  placeholder="Ej: 60"
                  className="flex-1 px-4 py-3 text-base font-medium border rounded-xl bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center px-3 text-sm font-medium border rounded-xl bg-muted border-border text-muted-foreground">
                  kg
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Repeticiones completadas
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={entry.repsCompleted}
                onChange={e => onChange('repsCompleted', e.target.value)}
                placeholder="Ej: 8"
                className="flex-1 px-4 py-3 text-base font-medium border rounded-xl bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center px-3 text-sm font-medium border rounded-xl bg-muted border-border text-muted-foreground">
                reps
              </div>
            </div>
          </div>
        </div>

        {/* Preview del RM calculado */}
        {hasRM ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4 py-3 border rounded-xl bg-emerald-500/10 border-emerald-500/20">
              <div>
                <p className="text-[10px] text-emerald-400/70 uppercase tracking-wide font-medium">1RM Estimado</p>
                <p className="text-xl font-bold text-emerald-400">{entry.calculatedRM} kg</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Semana 1 → Peso</p>
                <p className="text-base font-bold text-foreground">
                  {prescribedKg} kg
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/ {prescribedLb} lb</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  @ {Math.round(week1Config.intensityPct * 100)}% — {week1Config.repRange} reps — {week1Config.rir}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 border border-dashed rounded-xl bg-muted border-border">
            <Weight size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Ingresa peso y reps para ver tu RM estimado
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: sesión de test (lista scrollable de ejercicios)
// ─────────────────────────────────────────────────────────────────────────────
function SessionScreen({
  sessionPhase,
  entries,
  sessionTitle,
  sessionSubtitle,
  dayLabel,
  saving,
  error,
  onUpdate,
  onFinish,
}: {
  sessionPhase: 'session-1' | 'session-2'
  entries: RMEntry[]
  sessionTitle: string
  sessionSubtitle: string
  dayLabel: string
  saving: boolean
  error: string | null
  onUpdate: (index: number, field: 'weightUsed' | 'repsCompleted' | 'bodyweightKg', value: string) => void
  onFinish: () => void
}) {
  const completedCount = entries.filter(e => e.calculatedRM !== null).length
  const allDone = completedCount === entries.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header fijo */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-lg px-4 py-4 mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary">{dayLabel}</p>
              <h1 className="text-base font-bold text-foreground">{sessionTitle}</h1>
              <p className="text-xs text-muted-foreground">{sessionSubtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Completados</p>
              <p className="text-lg font-bold text-foreground">
                {completedCount}<span className="text-sm text-muted-foreground">/{entries.length}</span>
              </p>
            </div>
          </div>
          {/* Barra de progreso global */}
          <div className="mt-3 h-1.5 rounded-full bg-muted">
            <div
              className="h-full transition-all rounded-full bg-primary"
              style={{ width: `${(completedCount / entries.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista de ejercicios */}
      <div className="max-w-lg px-4 py-4 pb-32 mx-auto space-y-4">
        {entries.map((entry, i) => (
          <ExerciseCard
            key={entry.slug}
            entry={entry}
            index={i}
            totalExercises={entries.length}
            sessionPhase={sessionPhase}
            onChange={(field, value) => onUpdate(i, field, value)}
          />
        ))}

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 border rounded-xl bg-red-500/10 border-red-500/20">
            <AlertTriangle size={14} className="text-red-400 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-lg px-4 py-4 mx-auto">
          {!allDone && (
            <p className="mb-3 text-xs text-center text-muted-foreground">
              Completa todos los ejercicios para continuar ({entries.length - completedCount} restantes)
            </p>
          )}
          <Button
            className="w-full h-12 text-base"
            onClick={onFinish}
            disabled={!allDone || saving}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 rounded-full border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                Guardando RMs...
              </>
            ) : sessionPhase === 'session-1' ? (
              <>
                Guardar y terminar Sesión 1
                <ChevronRight size={18} />
              </>
            ) : (
              <>
                <Check size={18} />
                Terminar calibración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: pantalla "between" (entre sesión 1 y 2)
// ─────────────────────────────────────────────────────────────────────────────
function BetweenScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10">
          <Check size={36} className="text-emerald-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">¡Sesión 1 completada!</h1>
          <p className="text-sm text-muted-foreground">
            Tus RMs de tren superior han sido guardados.
          </p>
        </div>

        <div className="px-4 py-4 space-y-3 text-left border rounded-2xl bg-muted border-border">
          <p className="text-sm font-semibold text-foreground">Antes de la Sesión 2:</p>
          {[
            '🛌 Descansa 1-2 días completos',
            '🍖 Asegura buena ingesta proteica hoy y mañana',
            '💧 Hidratación adecuada (mínimo 2L)',
            '😴 Duerme al menos 7-8 horas esta noche',
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <p className="text-sm text-foreground">{item}</p>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border rounded-xl bg-primary/5 border-primary/20">
          <p className="text-xs text-primary">
            La Sesión 2 testea tren inferior. Incluye RDL — no vayas al fallo total en ese ejercicio.
          </p>
        </div>

        <Button className="w-full h-12 text-base" onClick={onContinue}>
          Continuar con Sesión 2 — Lower
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: pantalla de resumen final
// ─────────────────────────────────────────────────────────────────────────────
function SummaryScreen({ validRMs, onDone }: { validRMs: RMEntry[]; onDone: () => void }) {
  const week1Config = getBlockConfig(1)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg px-4 py-6 pb-32 mx-auto space-y-6">

        {/* Header */}
        <div className="pt-4 space-y-2 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-3xl bg-primary/10">
            <Zap size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Motor Calibrado</h1>
          <p className="text-sm text-muted-foreground">
            {validRMs.length} RMs guardados. Aquí están tus pesos para la Semana 1 — Bloque de Acumulación.
          </p>
        </div>

        {/* Bloque info */}
        <div className="flex items-center gap-3 px-4 py-3 border rounded-2xl bg-primary/5 border-primary/20">
          <TrendingUp size={16} className="text-primary" />
          <div>
            <p className="text-xs font-semibold text-primary">Semana 1 — Acumulación</p>
            <p className="text-xs text-muted-foreground">
              {week1Config.repRange} reps · {week1Config.rir} · {Math.round(week1Config.intensityPct * 100)}% del RM
            </p>
          </div>
        </div>

        {/* Tabla de RMs */}
        <div className="space-y-2">
          {validRMs.map(entry => {
            const prescribed = calcWorkingWeight(entry.calculatedRM!, week1Config.intensityPct, 'kg')
            return (
              <div
                key={entry.slug}
                className="flex items-center justify-between px-4 py-3 border rounded-xl bg-card border-border"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium truncate text-foreground">{entry.nameEs}</p>
                  <p className="text-xs text-muted-foreground">
                    RM: <span className="font-semibold text-foreground">{entry.calculatedRM} kg</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-primary">{prescribed} kg</p>
                  <p className="text-[10px] text-muted-foreground">Semana 1</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA final */}
        <div className="pt-2 space-y-3">
          <Button className="w-full h-12 text-base" onClick={onDone}>
            <Zap size={18} />
            ¡Comenzar Semana 1!
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            El Motor IA ajustará los pesos automáticamente cada semana según tu progreso.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export function RMTestWizard({ onComplete }: { onComplete: () => void }) {
  const {
    phase,
    session1Entries,
    session2Entries,
    saving,
    error,
    validRMs,
    updateEntry,
    startSession1,
    startSession2,
    finishSession1,
    finishSession2,
    completeDone,
  } = useRMTest()

  // Cuando termina, notifica al padre para que re-renderice
  const handleDone = () => {
    completeDone()
    onComplete()
  }

  if (phase === 'intro') return <IntroScreen onStart={startSession1} />

  if (phase === 'session-1') {
    return (
      <SessionScreen
        sessionPhase="session-1"
        entries={session1Entries}
        sessionTitle={`Test de RMs — Upper`}
        sessionSubtitle="Día 1 (Torso A) + Día 4 (Torso B)"
        dayLabel="Sesión 1 de 2"
        saving={saving}
        error={error}
        onUpdate={(i, field, val) => updateEntry('session-1', i, field, val)}
        onFinish={finishSession1}
      />
    )
  }

  if (phase === 'between') return <BetweenScreen onContinue={startSession2} />

  if (phase === 'session-2') {
    return (
      <SessionScreen
        sessionPhase="session-2"
        entries={session2Entries}
        sessionTitle="Test de RMs — Lower"
        sessionSubtitle="Día 2 (Pierna A) + Día 5 (Pierna B)"
        dayLabel="Sesión 2 de 2"
        saving={saving}
        error={error}
        onUpdate={(i, field, val) => updateEntry('session-2', i, field, val)}
        onFinish={finishSession2}
      />
    )
  }

  if (phase === 'summary') return <SummaryScreen validRMs={validRMs} onDone={handleDone} />

  // 'done' — no debería renderizarse (el padre reemplaza este componente)
  return null
}

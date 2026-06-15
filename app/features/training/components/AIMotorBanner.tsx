// app/features/training/components/AIMotorBanner.tsx
//
// Banner informativo que muestra el estado actual del Motor IA.
// Aparece en la pantalla de entrenamiento (lista de rutinas).
// Si hay alertas semanales → muestra un warning amigable.
// Si el programa no está inicializado → invita al usuario a completar su perfil.

import { Brain, Zap, AlertTriangle, ChevronRight, Lock } from 'lucide-react'
import { cn } from '~/lib/utils'
import { useNavigate } from 'react-router'
import { useAITrainer } from '../hooks/useAITrainer'

export function AIMotorBanner() {
  const navigate = useNavigate()
  const {
    loading,
    programInitialized,
    blockLabel,
    currentWeek,
    isDeload,
    isRMTestPhase,
    weeklyAlerts,
    feedbackAnalysis,
  } = useAITrainer()

  if (loading) return null

  // Programa no inicializado → invitar al usuario a completar perfil
  if (!programInitialized) {
    return (
      <button
        type="button"
        onClick={() => navigate('/app/profile')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-left transition-all hover:border-primary/60 hover:bg-primary/10"
      >
        <div className="p-2 rounded-xl bg-primary/10">
          <Brain size={16} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Activa el Motor IA</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Completa tu perfil de atleta para obtener prescripciones personalizadas
          </p>
        </div>
        <ChevronRight size={16} className="text-primary/60" />
      </button>
    )
  }

  const hasAlerts = weeklyAlerts.length > 0
  const hasEarlyDeload = feedbackAnalysis?.shouldTriggerEarlyDeload === true

  return (
    <div className="space-y-2">
      {/* Bloque/semana actual */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl border',
        isDeload
          ? 'border-amber-400/30 bg-amber-400/5'
          : isRMTestPhase
            ? 'border-blue-400/30 bg-blue-400/5'
            : 'border-primary/20 bg-primary/5',
      )}>
        <div className={cn(
          'p-2 rounded-xl',
          isDeload ? 'bg-amber-400/10' : isRMTestPhase ? 'bg-blue-400/10' : 'bg-primary/10',
        )}>
          {isRMTestPhase
            ? <Lock size={15} className="text-blue-400" />
            : <Zap size={15} className={isDeload ? 'text-amber-400' : 'text-primary'} />
          }
        </div>
        <div className="flex-1">
          <p className={cn(
            'text-xs font-bold',
            isDeload ? 'text-amber-400' : isRMTestPhase ? 'text-blue-400' : 'text-primary',
          )}>
            {blockLabel}
          </p>
          {!isRMTestPhase && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Semana {currentWeek} de 16 · Motor IA activo
            </p>
          )}
          {isRMTestPhase && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Completa las 2 sesiones de calibración para activar el programa
            </p>
          )}
        </div>

        {/* Progreso de semana */}
        {!isRMTestPhase && (
          <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] text-muted-foreground">{currentWeek}/16</p>
            <div className="w-14 h-1.5 rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isDeload ? 'bg-amber-400' : 'bg-primary',
                )}
                style={{ width: `${(currentWeek / 16) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Alerta de deload preventivo por feedback */}
      {hasEarlyDeload && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl border border-red-400/30 bg-red-400/5">
          <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-400">Deload preventivo recomendado</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {feedbackAnalysis?.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Alertas semanales del análisis de deficiencias */}
      {hasAlerts && (
        <div className="space-y-1.5">
          {weeklyAlerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-4 py-2.5 rounded-xl border border-amber-400/20 bg-amber-400/5"
            >
              <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-300/90">{alert}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

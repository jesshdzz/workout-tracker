import { useState } from 'react'
import { Dumbbell, CalendarDays, Check } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { type AppMode, useAppModeStore } from '../store/appMode.store'

type ModeOption = {
  value: Exclude<AppMode, null>
  icon: React.ReactNode
  title: string
  description: string
  badges: string[]
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'free',
    icon: <Dumbbell size={22} />,
    title: 'Registro libre',
    description:
      'Registra tus entrenos sin planificación previa. Perfecto si entrenas por intuición o con una rutina propia.',
    badges: ['Sin configuración', 'Flexible', 'Recomendado para empezar'],
  },
  {
    value: 'periodization',
    icon: <CalendarDays size={22} />,
    title: 'Periodización',
    description:
      'Sigue un programa estructurado por bloques y semanas. Los pesos se calculan automáticamente a partir de tus RMs.',
    badges: ['Progresión automatizada', 'Bloques 1-2-3', 'Requiere configurar RMs'],
  },
]

/**
 * Modal de onboarding que aparece en el primer acceso.
 * El usuario elige entre registro libre o modo de periodización.
 * La elección se persiste en localStorage via useAppModeStore.
 *
 * Implementado como modal de pantalla completa (no AlertDialog) porque
 * NO es una acción destructiva, sino una configuración inicial de bienvenida.
 */
export function OnboardingModal() {
  const setMode = useAppModeStore((s) => s.setMode)
  const [selected, setSelected] = useState<Exclude<AppMode, null>>('free')
  const [saving, setSaving] = useState(false)

  const handleConfirm = () => {
    setSaving(true)
    setMode(selected)
    // No setSaving(false) — el modal se desmonta al cambiar mode
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 mb-2">
            <Dumbbell size={26} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">¡Bienvenido!</h1>
          <p className="text-sm text-muted-foreground">
            Elige cómo quieres usar la app. Puedes cambiarlo después en tu perfil.
          </p>
        </div>

        {/* Opciones */}
        <div className="space-y-3">
          {MODE_OPTIONS.map((option) => {
            const isSelected = selected === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-primary/5 border-primary/40 shadow-sm'
                    : 'bg-card border-border hover:border-border/80 hover:bg-muted/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icono + check */}
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isSelected ? <Check size={18} /> : option.icon}
                  </div>

                  {/* Texto */}
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{option.title}</p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {option.description}
                    </p>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {option.badges.map((b) => (
                        <span
                          key={b}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <Button
          className="w-full"
          size="lg"
          disabled={saving}
          onClick={handleConfirm}
        >
          {saving ? 'Guardando…' : 'Comenzar'}
        </Button>
      </div>
    </div>
  )
}

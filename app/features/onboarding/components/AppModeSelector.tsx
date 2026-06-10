import { Dumbbell, CalendarDays } from 'lucide-react'
import { type AppMode, useAppModeStore } from '~/features/onboarding/store/appMode.store'

const MODE_LABELS: Record<Exclude<AppMode, null>, { icon: React.ReactNode; label: string; description: string }> = {
  free: {
    icon: <Dumbbell size={14} />,
    label: 'Registro libre',
    description: 'Sin planificación programada',
  },
  periodization: {
    icon: <CalendarDays size={14} />,
    label: 'Periodización',
    description: 'Bloques y semanas con pesos automáticos',
  },
}

/**
 * Widget en la pantalla de perfil para cambiar el modo de uso de la app.
 * El cambio es inmediato y persiste en localStorage.
 */
export function AppModeSelector() {
  const mode = useAppModeStore((s) => s.mode)
  const setMode = useAppModeStore((s) => s.setMode)

  const currentMode = mode ?? 'free'
  const currentLabel = MODE_LABELS[currentMode]

  return (
    <div className="overflow-hidden rounded-2xl bg-card border border-border">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">Modo de la app</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cambia cómo quieres usar el tracker
        </p>
      </div>
      <div className="divide-y divide-border">
        {(Object.entries(MODE_LABELS) as [Exclude<AppMode, null>, typeof MODE_LABELS[keyof typeof MODE_LABELS]][]).map(
          ([value, { icon, label, description }]) => {
            const isActive = currentMode === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex items-center gap-3 w-full px-4 py-3 transition-colors text-left ${
                  isActive ? 'bg-primary/5' : 'hover:bg-muted/30'
                }`}
              >
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                </div>
                {isActive && (
                  <div className="size-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <div className="size-1.5 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            )
          }
        )}
      </div>
    </div>
  )
}

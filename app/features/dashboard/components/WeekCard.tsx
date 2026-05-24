import { Link } from 'react-router'
import { Dumbbell, ChevronRight } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { Database } from '~/core/types/database.types'

type Session = Database['public']['Tables']['sessions']['Row']

type Props = {
  activeSession: Session | null
}

export function WeekCard({ activeSession }: Props) {
  return (
    <div className="p-4 space-y-4 rounded-2xl bg-card shadow-sm border border-border">
      <div className="flex items-center gap-2">
        <Dumbbell size={16} className="text-primary" />
        <p className="text-sm font-medium text-foreground">Sesión de hoy</p>
      </div>

      {activeSession ? (
        <div className="space-y-3">
          <div className="px-3 py-2 border rounded-lg bg-primary/10 border-primary/20">
            <p className="text-xs font-medium text-primary">Sesión en progreso</p>
            <p className="text-sm text-foreground mt-0.5">
              {activeSession.name ?? 'Sesión sin nombre'}
            </p>
          </div>
          <Link to={`/app/training/${activeSession.id}`}>
            <Button className="w-full">
              Continuar sesión
              <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No hay sesión activa. ¿Listo para entrenar?
          </p>
          <Link to="/app/training">
            <Button className="w-full">
              Iniciar sesión
              <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

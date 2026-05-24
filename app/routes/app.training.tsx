import { useState } from 'react'
import type { Route } from './+types/app.training'
import { requireAuth } from '~/lib/auth.server'
import { exercisesRepository } from '~/repositories/exercises.repository'
import { useActiveSession } from '~/features/training/hooks/useActiveSession'
import { useSessionStore } from '~/features/training/store/session.store'
import { ExerciseCard } from '~/features/training/components/ExerciseCard'
import { RestTimer } from '~/features/training/components/RestTimer'
import { SessionSummary } from '~/features/training/components/SessionSummary'
import { Button } from '~/components/ui/button'
import { Clock, Play, Square, Dumbbell } from 'lucide-react'
import { formatDuration } from '~/core/utils/formatters'
import type { Database } from '~/core/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request)
  const result = await exercisesRepository.findAll()
  return { exercises: result.data ?? [] }
}

export default function TrainingRoute({ loaderData }: Route.ComponentProps) {
  const { exercises } = loaderData
  const { sessionId, elapsedSeconds, reset } = useSessionStore()
  const { startSession, finishSession } = useActiveSession()
  const [showSummary, setShowSummary] = useState(false)
  const [starting, setStarting] = useState(false)

  const handleStart = async () => {
    setStarting(true)
    await startSession({ name: `Entreno ${new Date().toLocaleDateString('es-ES')}` })
    setStarting(false)
  }

  const handleFinish = async () => {
    await finishSession()
    setShowSummary(true)
  }

  if (!sessionId) {
    return (
      <div className="px-4 py-20">
        <div className="flex flex-col items-center text-center max-w-sm mx-auto">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Dumbbell size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">¿Listo para entrenar?</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Inicia una sesión vacía y registra tus series ejercicio por ejercicio.
          </p>
          <Button onClick={handleStart} disabled={starting} className="w-full max-w-xs">
            <Play size={16} />
            {starting ? 'Preparando...' : 'Comenzar sesión'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Entreno</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium tabular-nums text-foreground">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
          <Button variant="destructive" size="sm" onClick={handleFinish}>
            <Square size={14} />
            Finalizar
          </Button>
        </div>
      </div>

      <RestTimer />

      <div className="space-y-3">
        {exercises.map(exercise => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            weightUnit="kg"
            targetSets={4}
          />
        ))}
      </div>

      {showSummary && <SessionSummary onClose={() => reset()} />}
    </div>
  )
}

import type { Route } from './+types/app.training.$sessionId'
import { requireAuth } from '~/lib/auth'
import { useSessionDetail } from '~/features/training/hooks/useSessionDetail'
import { SessionHeader } from '~/features/training/components/SessionHeader'
import { ExerciseLog } from '~/features/training/components/ExerciseLog'
import { RestTimer } from '~/features/training/components/RestTimer'
import { useSessionStore } from '~/features/training/store/session.store'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export async function clientLoader({ params }: Route.LoaderArgs) {
  await requireAuth()
  return { sessionId: params.sessionId }
}

export default function SessionDetailRoute({ loaderData }: Route.ComponentProps) {
  const { sessionId } = loaderData
  const { isResting } = useSessionStore()

  const {
    session,
    groupedExercises,
    totalEffectiveSets,
    totalPRs,
    durationLabel,
    loading,
    error,
  } = useSessionDetail(sessionId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-6 h-6 border-2 rounded-full animate-spin border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 bg-background">
        <p className="text-sm text-center text-destructive">
          {error ?? 'Sesión no encontrada'}
        </p>
        <Link to="/app">
          <Button variant="outline" className="border-border text-muted-foreground">
            Volver al inicio
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="px-4 py-6 space-y-4">

        <SessionHeader
          name={session.name}
          date={session.date}
          completed={session.completed ?? false}
          durationLabel={durationLabel}
          totalSets={totalEffectiveSets}
          totalPRs={totalPRs}
          routineName={session.routines?.name}
          weekNumber={session.week_number}
        />

        {/* Timer si la sesión sigue activa */}
        {!session.completed && isResting && (
          <div className="sticky z-10 top-4">
            <RestTimer />
          </div>
        )}

        {/* Continuar sesión si está activa */}
        {!session.completed && (
          <Link to="/app/training/active">
            <Button className="w-full h-12 mt-3 font-medium bg-primary hover:bg-primary/90">
              Continuar sesión
            </Button>
          </Link>
        )}

        {/* Ejercicios */}
        {groupedExercises.length === 0 ? (
          <div className="p-4 text-center rounded-2xl bg-card">
            <p className="text-sm text-muted-foreground">No hay series registradas en esta sesión</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Ejercicios</p>
            {groupedExercises.map((group) => (
              <ExerciseLog
                key={group.exerciseId}
                exerciseName={group.exerciseName}
                sets={group.sets}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
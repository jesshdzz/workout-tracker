import { useState } from 'react'
import type { Route } from './+types/app.training'
import { requireAuth } from '~/lib/auth'
import { exercisesRepository } from '~/repositories/exercises.repository'
import { useActiveSession } from '~/features/training/hooks/useActiveSession'
import { useSessionStore } from '~/features/training/store/session.store'
import { ExerciseCard } from '~/features/training/components/ExerciseCard'
import { RestTimer } from '~/features/training/components/RestTimer'
import { SessionSummary } from '~/features/training/components/SessionSummary'
import { Button } from '~/components/ui/button'
import { Clock, Play, Square, Dumbbell, AlertCircle, ArrowLeft } from 'lucide-react'
import { formatDuration } from '~/core/utils/formatters'
import type { Database } from '~/core/types/database.types'
import { Link } from 'react-router'

type Exercise = Database['public']['Tables']['exercises']['Row']

export async function clientLoader(_: Route.LoaderArgs) {
    await requireAuth()
    const result = await exercisesRepository.findAll()
    return { exercises: result.data ?? [] }
}

export default function TrainingRoute({ loaderData }: Route.ComponentProps) {
    const { exercises } = loaderData
    const { startSession, finishSession, sets, elapsedSeconds } = useActiveSession()
    const { sessionId, sessionName, reset } = useSessionStore()

    // Si hay sessionId en el store, ya hay sesión activa — no mostrar el form
    const [started, setStarted] = useState(!!sessionId)
    const [starting, setStarting] = useState(false)
    const [finished, setFinished] = useState(false)
    const [inputName, setInputName] = useState('')

    const handleStart = async () => {
        const name = inputName.trim() || `Entreno ${new Date().toLocaleDateString('es-ES')}`
        setStarting(true)
        await startSession({ name })
        setStarting(false)
        setStarted(true)
    }

    const handleFinish = async () => {
        await finishSession()
        setFinished(true)
    }

    const handleCloseSummary = () => {
        reset()
        setFinished(false)
        setStarted(false)
    }

    if (finished) {
        return (
            <SessionSummary
                sets={sets}
                elapsedSeconds={elapsedSeconds}
                onFinish={handleCloseSummary}
            />
        )
    }

    if (!started || !sessionId) {
        return (
            <div className="px-4 py-20">
                <div className="flex items-center gap-3">
                    <Link
                        to="/app"
                        className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-card text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                </div>
                <div className="flex flex-col items-center max-w-sm mx-auto text-center">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-primary/10">
                        <Dumbbell size={28} className="text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">¿Listo para entrenar?</h1>
                    <p className="mt-1 mb-6 text-sm text-muted-foreground">
                        Inicia una sesión vacía y registra tus series ejercicio por ejercicio.
                    </p>
                    <input
                        type="text"
                        placeholder="Ej: Upper A, Pecho y espalda..."
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        className="w-full max-w-sm px-4 py-3 border rounded-xl bg-card text-foreground border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-2 mb-4 text-xs text-muted-foreground">
                        Deja el campo vacío para usar un nombre predeterminado
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
                    {/* Usa sessionName del store, no el input local */}
                    <h1 className="text-lg font-bold text-foreground">
                        {sessionName ?? 'Sesión activa'}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long', day: 'numeric', month: 'long'
                        })}
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
                        targetSets={2}
                    />
                ))}
            </div>
        </div>
    )
}

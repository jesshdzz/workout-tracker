import { useState } from 'react'
import type { Route } from './+types/app.training'
import { requireAuth } from '~/lib/auth'
import { exercisesRepository } from '~/repositories/exercises.repository'
import { useActiveSession } from '~/features/training/hooks/useActiveSession'
import { useSessionStore } from '~/features/training/store/session.store'
import { SortableExerciseList } from '~/features/training/components/SortableExerciseList'
import { ExercisePicker } from '~/features/training/components/ExercisePicker'
import { RestTimer } from '~/features/training/components/RestTimer'
import { SessionSummary } from '~/features/training/components/SessionSummary'
import { FinishSessionModal } from '~/features/training/components/FinishSessionModal'
import { Button } from '~/components/ui/button'
import { Clock, Play, Square, Dumbbell, Plus, ArrowLeft } from 'lucide-react'
import { formatDuration } from '~/core/utils/formatters'
import { Link, useNavigate } from 'react-router'
import type { Database } from '~/core/types/database.types'

type ExerciseWithMuscles = Database['public']['Tables']['exercises']['Row'] & {
    exercise_muscles: {
        role: string
        muscle_groups: { slug: string; name_es: string; body_region: string } | null
    }[]
}

export async function clientLoader(_: Route.LoaderArgs) {
    await requireAuth()
    const result = await exercisesRepository.findAll()
    return { exercises: (result.data ?? []) as ExerciseWithMuscles[] }
}

export default function TrainingRoute({ loaderData }: Route.ComponentProps) {
    const { exercises } = loaderData
    const navigate = useNavigate()

    const { startSession, finishSession, discardSession, sets, elapsedSeconds } = useActiveSession()
    const {
        sessionId, sessionName, reset,
        sessionExercises, addExerciseToSession, reorderExercises,
    } = useSessionStore()

    const [started, setStarted] = useState(!!sessionId)
    const [starting, setStarting] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [showSummary, setShowSummary] = useState(false)
    const [showPicker, setShowPicker] = useState(false)
    const [inputName, setInputName] = useState('')

    const handleStart = async () => {
        const name = inputName.trim() || `Entreno ${new Date().toLocaleDateString('es-ES')}`
        setStarting(true)
        await startSession({ name })
        setStarting(false)
        setStarted(true)
    }

    const handleFinishPress = () => setShowConfirmModal(true)

    const handleConfirmFinish = () => {
        setShowConfirmModal(false)
        setShowSummary(true)
    }

    const handleSave = async () => {
        await finishSession()
        reset()
        navigate('/app')
    }

    const handleDiscard = async () => {
        await discardSession()
        reset()
        navigate('/app')
    }

    const handleAddExercises = (selected: ExerciseWithMuscles[]) => {
        selected.forEach((ex, i) => {
            addExerciseToSession({
                exerciseId: ex.id,
                exerciseName: ex.name_es ?? ex.name,
                order: sessionExercises.length + i,
            })
        })
    }

    const alreadyInSession = sessionExercises.map((ex) => ex.exerciseId)

    if (showSummary) {
        return (
            <SessionSummary
                sets={sets}
                elapsedSeconds={elapsedSeconds}
                onSave={handleSave}
                onDiscard={handleDiscard}
            />
        )
    }

    // Pantalla inicial
    if (!started || !sessionId) {
        return (
            <div className="px-4 py-20">
                <div className="flex items-center gap-3 mb-6">
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

    // Sesión activa
    return (
        <div className="px-4 py-4 pb-32 space-y-4">
            {/* Modales */}
            {showConfirmModal && (
                <FinishSessionModal
                    onConfirm={handleConfirmFinish}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
            {showPicker && (
                <ExercisePicker
                    exercises={exercises}
                    alreadyInSession={alreadyInSession}
                    onAdd={handleAddExercises}
                    onClose={() => setShowPicker(false)}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
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
                    <Button variant="destructive" size="sm" onClick={handleFinishPress}>
                        <Square size={14} />
                        Finalizar
                    </Button>
                </div>
            </div>

            <RestTimer />

            {/* Lista de ejercicios vacía */}
            {sessionExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted">
                        <Dumbbell size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                        No hay ejercicios en esta sesión.{'\n'}Toca el botón + para agregar.
                    </p>
                </div>
            ) : (
                <SortableExerciseList
                    sessionExercises={sessionExercises}
                    allExercises={exercises}
                    weightUnit="kg"
                    onReorder={reorderExercises}
                />
            )}

            {/* FAB */}
            <button
                onClick={() => setShowPicker(true)}
                className="fixed z-50 flex items-center h-12 gap-2 px-4 text-sm font-medium transition-colors rounded-full shadow-lg bottom-20 right-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
                <Plus size={18} />
                Ejercicio
            </button>
        </div>
    )
}
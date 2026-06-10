import { useState, useEffect } from 'react'
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
import { IncompleteSetsModal } from '~/features/training/components/IncompleteSetsModal'
import { Button } from '~/components/ui/button'
import { Clock, Play, Square, Dumbbell, Plus, ArrowLeft } from 'lucide-react'
import { formatDuration } from '~/core/utils/formatters'
import { Link, useNavigate } from 'react-router'
import type { Database } from '~/core/types/database.types'
import { NumericKeyboard } from '~/shared/components/NumericKeyboard'
import { useNumericKeyboard } from '~/shared/hooks/useNumericKeyboard'
import { KeyboardProvider } from '~/features/training/context/keyboardContext'
import { routinesRepository, type RoutineWithExercises } from '~/repositories/routines.repository'

type ExerciseWithMuscles = Database['public']['Tables']['exercises']['Row'] & {
    target_reps?: string
    target_sets?: number
    target_rir?: number | null
    intensityPct?: number | null
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
    const keyboard = useNumericKeyboard()

    const { startSession, finishSession, discardSession, sets, elapsedSeconds } = useActiveSession()
    const {
        sessionId, sessionName, routineId, reset,
        sessionExercises, addExerciseToSession, reorderExercises, removeExerciseFromSession
    } = useSessionStore()

    const [started, setStarted] = useState(!!sessionId)
    const [starting, setStarting] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [showSummary, setShowSummary] = useState(false)
    const [showPicker, setShowPicker] = useState(false)
    const [showIncompleteModal, setShowIncompleteModal] = useState(false)
    const [inputName, setInputName] = useState('')
    const [currentRoutine, setCurrentRoutine] = useState<RoutineWithExercises | null>(null)

    useEffect(() => {
        if (!routineId) {
            setCurrentRoutine(null)
            return
        }
        const loadRoutine = async () => {
            const result = await routinesRepository.findById(routineId)
            if (result.data) {
                setCurrentRoutine(result.data)
            }
        }
        loadRoutine()
    }, [routineId])


    const handleStart = async () => {
        const name = inputName.trim() || `Entreno ${new Date().toLocaleDateString('es-ES')}`
        setStarting(true)
        await startSession({ name })
        setStarting(false)
        setStarted(true)
    }

    const handleFinishPress = () => {
        // Contar series con datos ingresados pero sin marcar (pendingSets con weight y reps)
        const pendingSetsAll = Object.values(
            useSessionStore.getState().pendingSets
        ).flat()
        const incompleteFilled = pendingSetsAll.filter(s => s.weight && s.reps).length

        if (incompleteFilled > 0) {
            setShowIncompleteModal(true)
        } else {
            setShowConfirmModal(true)
        }
    }

    const handleConfirmFinish = () => {
        setShowConfirmModal(false)
        setShowSummary(true)
    }

    const handleSaveWithRoutine = async () => {
        await finishSession()
        reset()
        // setShowSummary(false)
        // setStarted(false)
        navigate('/app/training?createRoutine=1', { replace: true })
    }

    const handleSaveOnly = async () => {
        await finishSession()
        reset()
        navigate('/app', { replace: true })
    }

    const handleSaveAsTemplate = async () => {
        await finishSession()
        reset()
        navigate('/app/training?createRoutine=1', { replace: true })
    }

    const handleSaveKeepRoutine = async () => {
        await finishSession()  // guarda historial, no toca la rutina
        reset()
        navigate('/app', { replace: true })
    }

    const handleSaveUpdateValues = async () => {
        await finishSession()
        // Actualiza los pesos de referencia en routine_exercises
        // basado en los sets realizados (último peso/reps por ejercicio)
        if (routineId && currentRoutine) {
            const lastSetByExercise = new Map<string, { weight: number; reps: number }>()
            sets.filter(s => s.setType === 'effective').forEach(s => {
                lastSetByExercise.set(s.exerciseId, { weight: s.weight, reps: s.reps })
            })
            // Por ahora solo guardamos el historial — la actualización de valores
            // de referencia en rutinas es una mejora futura
        }
        reset()
        navigate('/app', { replace: true })
    }

    const handleSaveUpdateRoutine = async () => {
        await finishSession()
        if (routineId) {
            // Sincroniza los ejercicios de la sesión con la rutina
            await routinesRepository.syncExercises(
                routineId,
                sessionExercises.map((ex, i) => ({
                    exercise_id: ex.exerciseId,
                    sort_order: i,
                    target_sets: ex.targetSets,
                    target_reps: ex.targetReps,
                    target_rir: ex.targetRir ?? null,
                    intensity_pct: ex.intensityPct ?? null,
                }))
            )
        }
        reset()
        navigate('/app', { replace: true })
    }

    const handleDiscard = async () => {
        const result = await discardSession()
        // Solo limpiamos el store si el descarte fue exitoso.
        // Si falla, el sessionId queda en store para poder reintentar.
        if (result?.error) {
            console.error('Error al descartar la sesión:', result.error.message)
            return
        }
        reset()
        navigate('/app', { replace: true })
    }

    const handleAddExercises = (selected: ExerciseWithMuscles[]) => {
        selected.forEach((ex, i) => {
            addExerciseToSession({
                exerciseId: ex.id,
                exerciseName: ex.name_es ?? ex.name,
                order: sessionExercises.length + i,
                targetSets: ex.target_sets ?? 2,
                targetReps: ex.target_reps ?? '8-12',
                targetRir: ex.target_rir ?? null,
                intensityPct: ex.intensityPct ?? null,
            })
        })
    }

    const alreadyInSession = sessionExercises.map((ex) => ex.exerciseId)

    // Pantalla inicial
    // if (!started || !sessionId) {
    //     return (
    //         <div className="px-4 py-20">
    //             <div className="flex items-center gap-3 mb-6">
    //                 <Link
    //                     to="/app"
    //                     className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-card text-muted-foreground hover:text-foreground"
    //                 >
    //                     <ArrowLeft size={16} />
    //                 </Link>
    //             </div>
    //             <div className="flex flex-col items-center max-w-sm mx-auto text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-primary/10">
    //                     <Dumbbell size={28} className="text-primary" />
    //                 </div>
    //                 <h1 className="text-xl font-bold text-foreground">¿Listo para entrenar?</h1>
    //                 <p className="mt-1 mb-6 text-sm text-muted-foreground">
    //                     Inicia una sesión vacía y registra tus series ejercicio por ejercicio.
    //                 </p>
    //                 <input
    //                     type="text"
    //                     placeholder="Ej: Upper A, Pecho y espalda..."
    //                     value={inputName}
    //                     onChange={(e) => setInputName(e.target.value)}
    //                     className="w-full max-w-sm px-4 py-3 border rounded-xl bg-card text-foreground border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    //                 />
    //                 <p className="mt-2 mb-4 text-xs text-muted-foreground">
    //                     Deja el campo vacío para usar un nombre predeterminado
    //                 </p>
    //                 <Button onClick={handleStart} disabled={starting} className="w-full max-w-xs">
    //                     <Play size={16} />
    //                     {starting ? 'Preparando...' : 'Comenzar sesión'}
    //                 </Button>
    //             </div>
    //         </div>
    //     )
    // }

    // Sesión activa
    return (
        <KeyboardProvider value={keyboard}>
            <div className="px-4 py-4 pb-32 space-y-4">
                <div className="px-4 py-4 pb-32 space-y-4">
                    {/* Modales */}
                    {showConfirmModal && (
                        <FinishSessionModal
                            onConfirm={handleConfirmFinish}
                            onCancel={() => setShowConfirmModal(false)}
                        />
                    )}
                    <IncompleteSetsModal
                        open={showIncompleteModal}
                        incompleteSetsCount={
                            Object.values(useSessionStore.getState().pendingSets)
                                .flat()
                                .filter(s => s.weight && s.reps).length
                        }
                        onConfirm={() => {
                            setShowIncompleteModal(false)
                            setShowConfirmModal(true)
                        }}
                        onCancel={() => setShowIncompleteModal(false)}
                    />
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
                            onRemoveExercise={removeExerciseFromSession}
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
            </div>

            {showSummary && (
                <SessionSummary
                    sets={sets}
                    elapsedSeconds={elapsedSeconds}
                    sessionName={sessionName}
                    routineId={routineId}          // del store
                    routine={currentRoutine}
                    sessionExercises={sessionExercises}
                    onSaveOnly={handleSaveOnly}
                    onSaveAsTemplate={handleSaveAsTemplate}
                    onSaveKeepRoutine={handleSaveKeepRoutine}
                    onSaveUpdateValues={handleSaveUpdateValues}
                    onSaveUpdateRoutine={handleSaveUpdateRoutine}
                    onDiscard={handleDiscard}
                />
            )}

            {/* Teclado fijo */}
            {keyboard.isOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-[70]">
                    <NumericKeyboard
                        value={keyboard.activeField?.value ?? ''}
                        onChange={keyboard.handleChange}
                        onClose={keyboard.closeKeyboard}
                        label={keyboard.activeField?.label}
                        decimal={keyboard.activeField?.decimal ?? true}
                    />
                </div>
            )}
        </KeyboardProvider>
    )
}
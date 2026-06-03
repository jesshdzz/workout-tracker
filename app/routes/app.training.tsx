import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { Route } from './+types/app.training'
import { requireAuth } from '~/lib/auth'
import { exercisesRepository } from '~/repositories/exercises.repository'
import { routinesRepository } from '~/repositories/routines.repository'
import { useRoutines } from '~/features/routines/hooks/useRoutines'
import { useActiveSession } from '~/features/training/hooks/useActiveSession'
import { useSessionStore } from '~/features/training/store/session.store'
import { RoutineCard } from '~/features/routines/components/RoutineCard'
import { RenameModal } from '~/features/routines/components/RenameModal'
import { DeleteRoutineModal } from '~/features/routines/components/DeleteRoutineModal'
import { RoutineBuilder } from '~/features/routines/components/RoutineBuilder'
import { Button } from '~/components/ui/button'
import { Plus, Zap } from 'lucide-react'
import type { Database } from '~/core/types/database.types'
import type { RoutineWithExercises } from '~/repositories/routines.repository'
import type { RoutineExerciseConfig } from '~/features/routines/components/RoutineBuilder'
import { useAuth } from '~/features/auth/AuthProvider'
import { RoutinePreviewSheet } from '~/features/routines/components/RoutinePreviewSheet'

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

type Modal =
    | { type: 'rename'; routine: RoutineWithExercises }
    | { type: 'delete'; routine: RoutineWithExercises }
    | { type: 'builder'; routine?: RoutineWithExercises }
    | null

export default function TrainingRoute({ loaderData }: Route.ComponentProps) {
    const { exercises } = loaderData
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { user } = useAuth()
    const { routines, loading, rename, duplicate, remove, reload } = useRoutines()
    const { startSession } = useActiveSession()
    const { sessionId } = useSessionStore()
    const [modal, setModal] = useState<Modal>(null)
    const [previewRoutine, setPreviewRoutine] = useState<RoutineWithExercises | null>(null)


    useEffect(() => {
        if (searchParams.get('createRoutine') === '1') {
            setModal({ type: 'builder' })
            setSearchParams({})  // limpia el param
        }
    }, [searchParams])

    // Si hay sesión activa, ir directo a ella
    const goToActiveSession = () => navigate('/app/training/active')

    const handleQuickStart = async () => {
        if (sessionId) { goToActiveSession(); return }
        await startSession({ name: `Entreno ${new Date().toLocaleDateString('es-ES')}` })
        navigate('/app/training/active')
    }

    const handleStartRoutine = async (routine: RoutineWithExercises) => {
        if (sessionId) { goToActiveSession(); return }

        const session = await startSession({
            routineId: routine.id,
            name: routine.name,
        })

        if (!session) return

        // Carga los ejercicios de la rutina en el store
        const { addExerciseToSession } = useSessionStore.getState()
        routine.routine_exercises.forEach((re, i) => {
            if (re.exercises) {
                let sets: any[] = []
                let warmupSets = 0
                let technique = 'normal'
                let restAfterSeconds = 90

                if (re.notes) {
                    try {
                        const parsed = JSON.parse(re.notes)
                        if (Array.isArray(parsed.sets)) {
                            sets = parsed.sets
                        } else {
                            warmupSets = parsed.warmupSets ?? 0
                            technique = parsed.technique ?? 'normal'
                            restAfterSeconds = parsed.restAfterSeconds ?? 90
                        }
                    } catch (e) {
                        // notes is raw text, ignore parsing
                    }
                }

                addExerciseToSession({
                    exerciseId: re.exercises.id,
                    exerciseName: re.exercises.name_es ?? re.exercises.name,
                    order: i,
                    targetSets: re.target_sets ?? 2,
                    targetReps: re.target_reps ?? '8-12',
                    targetRir: re.target_rir ?? null,
                    intensityPct: re.intensity_pct ?? null,
                    warmupSets,
                    technique,
                    restAfterSeconds,
                    sets: sets.length > 0 ? sets : undefined,
                })
            }
        })

        navigate('/app/training/active')
    }

    const handleSaveRoutine = async (
        name: string,
        exConfigs: RoutineExerciseConfig[]
    ) => {
        if (!user) return

        const isEdit = modal?.type === 'builder' && modal.routine

        if (isEdit) {
            await routinesRepository.update(modal.routine!.id, { name })
            await routinesRepository.syncExercises(
                modal.routine!.id,
                exConfigs.map((ex, i) => ({
                    exercise_id: ex.exerciseId,
                    sort_order: i,
                    target_sets: ex.sets.length,
                    target_reps: ex.sets[0]?.reps ?? '8-12',
                    target_rir: null,
                    intensity_pct: null,
                    notes: JSON.stringify({
                        sets: ex.sets,
                        notesText: ex.notesText ?? '',
                    }),
                }))
            )
        } else {
            await routinesRepository.create(
                { user_id: user.id, name, is_public: false },
                exConfigs.map((ex, i) => ({
                    exercise_id: ex.exerciseId,
                    sort_order: i,
                    target_sets: ex.sets.length,
                    target_reps: ex.sets[0]?.reps ?? '8-12',
                    target_rir: null,
                    intensity_pct: null,
                    notes: JSON.stringify({
                        sets: ex.sets,
                        notesText: ex.notesText ?? '',
                    }),
                }))
            )
        }

        setModal(null)
        reload()
    }

    // Builder de rutina — pantalla completa
    if (modal?.type === 'builder') {
        const routine = modal.routine
        return (
            <RoutineBuilder
                initialName={routine?.name}
                initialExercises={routine?.routine_exercises.map(re => {
                    let sets: any[] = []
                    let notesText = ''
                    if (re.notes) {
                        try {
                            const parsed = JSON.parse(re.notes)
                            if (Array.isArray(parsed.sets)) {
                                sets = parsed.sets
                            } else {
                                const warmupCount = parsed.warmupSets ?? 0
                                const rest = parsed.restAfterSeconds ?? 90
                                const tech = parsed.technique ?? 'normal'
                                const repsStr = re.target_reps ?? '8-12'
                                const totalSets = re.target_sets ?? 3

                                for (let w = 0; w < warmupCount; w++) {
                                    sets.push({
                                        setType: 'warmup',
                                        reps: repsStr,
                                        technique: 'normal',
                                        restAfterSeconds: rest
                                    })
                                }
                                const effectiveCount = Math.max(1, totalSets - warmupCount)
                                for (let e = 0; e < effectiveCount; e++) {
                                    sets.push({
                                        setType: 'effective',
                                        reps: repsStr,
                                        technique: tech,
                                        restAfterSeconds: rest
                                    })
                                }
                            }
                            notesText = parsed.notesText ?? ''
                        } catch (e) {
                            notesText = re.notes
                        }
                    }

                    if (sets.length === 0) {
                        const totalSets = re.target_sets ?? 3
                        const repsStr = re.target_reps ?? '8-12'
                        for (let e = 0; e < totalSets; e++) {
                            sets.push({
                                setType: 'effective',
                                reps: repsStr,
                                technique: 'normal',
                                restAfterSeconds: 90
                            })
                        }
                    }

                    return {
                        exerciseId: re.exercises?.id ?? '',
                        exerciseName: re.exercises?.name_es ?? re.exercises?.name ?? '',
                        sets,
                        notesText,
                    }
                })}
                allExercises={exercises}
                onSave={handleSaveRoutine}
                onCancel={() => setModal(null)}
            />
        )
    }

    return (
        <div className="max-w-lg min-h-screen px-4 py-6 pb-24 mx-auto space-y-6 bg-background">

            {/* Modales */}
            {modal?.type === 'rename' && (
                <RenameModal
                    currentName={modal.routine.name}
                    onSave={async (name) => {
                        await rename(modal.routine.id, name)
                        setModal(null)
                    }}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal?.type === 'delete' && (
                <DeleteRoutineModal
                    routineName={modal.routine.name}
                    onConfirm={async () => {
                        await remove(modal.routine.id)
                        setModal(null)
                    }}
                    onCancel={() => setModal(null)}
                />
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Entrenar</h1>
            </div>

            {/* Sesión activa — si existe */}
            {sessionId && (
                <button
                    type="button"
                    onClick={goToActiveSession}
                    className="flex items-center justify-between w-full px-4 py-3 text-left border rounded-2xl bg-primary/10 border-primary/30"
                >
                    <div>
                        <p className="text-sm font-medium text-primary">Sesión en progreso</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Toca para continuar</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </button>
            )}

            {/* Inicio rápido */}
            <div className="space-y-2">
                <p className="text-sm font-bold text-foreground">Inicio rápido</p>
                <Button
                    onClick={handleQuickStart}
                    className="w-full h-12 gap-2"
                    disabled={!!sessionId}
                >
                    <Zap size={16} />
                    Iniciar entreno vacío
                </Button>
            </div>

            {/* Plantillas */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">
                        Plantillas
                        {routines.length > 0 && (
                            <span className="ml-1.5 text-muted-foreground font-normal">
                                ({routines.length})
                            </span>
                        )}
                    </p>
                    <button
                        type="button"
                        onClick={() => setModal({ type: 'builder' })}
                        className="flex items-center gap-1 text-xs font-medium text-primary"
                    >
                        <Plus size={14} />
                        Nueva
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-5 h-5 border-2 rounded-full animate-spin border-primary border-t-transparent" />
                    </div>
                ) : routines.length === 0 ? (
                    <button
                        type="button"
                        onClick={() => setModal({ type: 'builder' })}
                        className="flex flex-col items-center justify-center w-full gap-2 py-12 transition-colors border-2 border-dashed rounded-2xl border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    >
                        <Plus size={20} />
                        <span className="text-sm">Crea tu primera plantilla</span>
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {routines.map(routine => (
                            <RoutineCard
                                key={routine.id}
                                routine={routine}
                                onStart={() => setPreviewRoutine(routine)}
                                onEdit={() => setModal({ type: 'builder', routine })}
                                onRename={() => setModal({ type: 'rename', routine })}
                                onDuplicate={() => duplicate(routine.id)}
                                onDelete={() => setModal({ type: 'delete', routine })}
                            />
                        ))}
                    </div>
                )}
            </div>

            {previewRoutine && (
                <RoutinePreviewSheet
                    routine={previewRoutine}
                    onStart={() => {
                        handleStartRoutine(previewRoutine)
                        setPreviewRoutine(null)
                    }}
                    onEdit={() => {
                        setPreviewRoutine(null)
                        setModal({ type: 'builder', routine: previewRoutine })
                    }}
                    onClose={() => setPreviewRoutine(null)}
                />
            )}
        </div>
    )
}
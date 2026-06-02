import { useMemo } from 'react'
import { formatDuration } from '~/core/utils/formatters'
import { Clock, Dumbbell, Trophy, ListChecks } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { ActiveSet, SessionExercise } from '../store/session.store'
import type { RoutineWithExercises } from '~/repositories/routines.repository'

type Props = {
    sets: ActiveSet[]
    elapsedSeconds: number
    sessionName: string | null
    routineId: string | null    // null = entreno rápido
    routine: RoutineWithExercises | null
    sessionExercises: SessionExercise[]
    // Callbacks
    onSaveOnly: () => void    // solo historial (rápido sin rutina)
    onSaveAsTemplate: () => void    // rápido → crear plantilla
    onSaveKeepRoutine: () => void    // rutina → guardar sin cambiar plantilla
    onSaveUpdateValues: () => void    // rutina → actualizar solo pesos/reps
    onSaveUpdateRoutine: () => void    // rutina → actualizar estructura + valores
    onDiscard: () => void
}

type ChangeType = 'none' | 'values_only' | 'structural'

export function SessionSummary({
    sets, elapsedSeconds, sessionName, routineId, routine, sessionExercises,
    onSaveOnly, onSaveAsTemplate, onSaveKeepRoutine,
    onSaveUpdateValues, onSaveUpdateRoutine, onDiscard,
}: Props) {
    const effectiveSets = sets.filter(s => s.setType === 'effective')
    const prs = sets.filter(s => s.isPR)
    const exercisesWorked = new Set(sets.map(s => s.exerciseId)).size

    // Detectar tipo de cambio respecto a la rutina original
    const changeType = useMemo((): ChangeType => {
        if (!routine || !routineId) return 'none'

        const routineExIds = new Set(routine.routine_exercises.map(re => re.exercises?.id).filter(Boolean))
        const sessionExIds = new Set(sessionExercises.map(ex => ex.exerciseId))

        const addedExercises = [...sessionExIds].filter(id => !routineExIds.has(id))
        const removedExercises = [...routineExIds].filter(id => !sessionExIds.has(id!))

        if (addedExercises.length > 0 || removedExercises.length > 0) return 'structural'
        return 'values_only'
    }, [routine, routineId, sessionExercises])

    // Diff legible de cambios estructurales
    const structuralDiff = useMemo(() => {
        if (!routine || changeType !== 'structural') return null
        const routineExIds = new Set(routine.routine_exercises.map(re => re.exercises?.id).filter(Boolean))
        const sessionExIds = new Set(sessionExercises.map(ex => ex.exerciseId))
        const added = sessionExercises.filter(ex => !routineExIds.has(ex.exerciseId))
        const removed = routine.routine_exercises.filter(re => re.exercises && !sessionExIds.has(re.exercises.id))
        return { added, removed }
    }, [routine, changeType, sessionExercises])

    const stats = [
        { icon: Clock, label: 'Duración', value: formatDuration(elapsedSeconds) },
        { icon: ListChecks, label: 'Series', value: effectiveSets.length.toString() },
        { icon: Dumbbell, label: 'Ejercicios', value: exercisesWorked.toString() },
        { icon: Trophy, label: 'PRs', value: prs.length.toString(), highlight: prs.length > 0 },
    ]

    const isRoutineSession = !!routineId && !!routine

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/20 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg overflow-hidden border bg-card rounded-2xl border-border">

                {/* Stats */}
                <div className="p-6 space-y-4">
                    <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center mx-auto mb-3 rounded-full w-14 h-14 bg-primary/10">
                            <Trophy size={24} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">¡Entreno completado!</h2>
                        <p className="text-sm text-muted-foreground">{sessionName ?? 'Sesión sin nombre'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {stats.map(({ icon: Icon, label, value, highlight }) => (
                            <div
                                key={label}
                                className={`rounded-xl p-3 border text-center ${highlight ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'
                                    }`}
                            >
                                <Icon size={14} className={`mx-auto mb-1 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                                <p className={`text-lg font-bold font-mono ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Opciones según contexto */}
                <div className="px-6 pt-4 pb-6 space-y-2 border-t border-border">

                    {/* ENTRENO RÁPIDO */}
                    {!isRoutineSession && (
                        <>
                            <Button onClick={onSaveAsTemplate} className="w-full h-11">
                                Guardar y crear plantilla
                            </Button>
                            <Button variant="outline" onClick={onSaveOnly} className="w-full h-11">
                                Solo guardar en historial
                            </Button>
                        </>
                    )}

                    {/* RUTINA — sin cambios estructurales */}
                    {isRoutineSession && changeType === 'values_only' && (
                        <>
                            <Button onClick={onSaveUpdateValues} className="w-full h-11">
                                Actualizar valores
                                <span className="ml-1 text-xs opacity-75">
                                    (pesos y reps)
                                </span>
                            </Button>
                            <Button variant="outline" onClick={onSaveKeepRoutine} className="w-full h-11">
                                Conservar rutina original
                            </Button>
                        </>
                    )}

                    {/* RUTINA — cambios estructurales */}
                    {isRoutineSession && changeType === 'structural' && (
                        <>
                            {structuralDiff && (
                                <p className="pb-1 text-xs text-center text-muted-foreground">
                                    {structuralDiff.added.length > 0 && `+${structuralDiff.added.length} ejercicio${structuralDiff.added.length > 1 ? 's' : ''}`}
                                    {structuralDiff.added.length > 0 && structuralDiff.removed.length > 0 && ' · '}
                                    {structuralDiff.removed.length > 0 && `-${structuralDiff.removed.length} ejercicio${structuralDiff.removed.length > 1 ? 's' : ''}`}
                                </p>
                            )}
                            <Button onClick={onSaveUpdateRoutine} className="w-full h-11">
                                Actualizar rutina
                            </Button>
                            <Button variant="outline" onClick={onSaveKeepRoutine} className="w-full h-11">
                                Conservar rutina original
                            </Button>
                        </>
                    )}

                    {/* Descartar — siempre disponible */}
                    <button
                        type="button"
                        onClick={onDiscard}
                        className="w-full py-2.5 text-sm text-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Descartar entreno
                    </button>
                </div>
            </div>
        </div>
    )
}
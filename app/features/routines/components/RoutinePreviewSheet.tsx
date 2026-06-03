import { X, Pencil, Clock } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { formatRelative } from '~/core/utils/formatters'
import type { RoutineWithExercises } from '~/repositories/routines.repository'

type Props = {
    routine: RoutineWithExercises
    onStart: () => void
    onEdit: () => void
    onClose: () => void
}

export function RoutinePreviewSheet({ routine, onStart, onEdit, onClose }: Props) {
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-foreground/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col max-h-[85vh] bg-card rounded-t-2xl border-t border-border">

                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-border" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground"
                    >
                        <X size={16} />
                    </button>
                    <h2 className="text-base font-bold text-foreground">{routine.name}</h2>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="text-sm font-medium text-primary"
                    >
                        Editar
                    </button>
                </div>

                {/* Meta */}
                <div className="px-4 py-2 border-b border-border shrink-0">
                    {routine.last_used && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock size={12} />
                            <span>Último: {formatRelative(routine.last_used)}</span>
                        </div>
                    )}
                    {routine.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{routine.description}</p>
                    )}
                </div>

                {/* Lista de ejercicios */}
                <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto">
                    {routine.routine_exercises.map((re, i) => {
                        const ex = re.exercises
                        if (!ex) return null

                        let sets: any[] = []
                        let notesText = ''
                        if (re.notes) {
                            try {
                                const parsed = JSON.parse(re.notes)
                                if (Array.isArray(parsed.sets)) {
                                    sets = parsed.sets
                                }
                                notesText = parsed.notesText ?? ''
                            } catch (e) {}
                        }

                        return (
                            <div key={re.id} className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                        {ex.name_es ?? ex.name}
                                    </p>
                                    {sets.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {sets.map((s, idx) => {
                                                const isWarmup = s.setType === 'warmup'
                                                const techName = s.technique === 'failure' ? 'F' : s.technique === 'rest_pause' ? 'RP' : s.technique === 'drop_set' ? 'DS' : ''
                                                const effectiveIdx = sets.slice(0, idx).filter(x => x.setType === 'effective').length + (s.setType === 'effective' ? 1 : 0)
                                                return (
                                                    <span
                                                        key={idx}
                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                                            isWarmup
                                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                                : 'bg-primary/10 text-primary border-primary/20'
                                                        }`}
                                                    >
                                                        {isWarmup ? 'W' : effectiveIdx}: {s.reps}{techName ? ` (${techName})` : ''}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        re.target_reps && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {re.target_sets && `${re.target_sets} × `}{re.target_reps} reps
                                                {re.target_rir !== null && ` · RIR ${re.target_rir}`}
                                                {re.intensity_pct && ` · ${Math.round(re.intensity_pct * 100)}%`}
                                            </p>
                                        )
                                    )}
                                    {notesText && (
                                        <p className="text-[10px] text-muted-foreground mt-1 italic">
                                            💡 {notesText}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-border shrink-0">
                    <Button onClick={onStart} className="w-full h-12 font-medium">
                        Entrenar
                    </Button>
                </div>
            </div>
        </>
    )
}
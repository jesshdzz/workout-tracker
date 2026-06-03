import { useState } from 'react'
import { ArrowLeft, Plus, GripVertical, X, Save, Trash } from 'lucide-react'
import {
    DndContext, closestCenter, PointerSensor,
    useSensor, useSensors, type DragEndEvent
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '~/components/ui/button'
import { ExercisePicker } from '~/features/training/components/ExercisePicker'
import type { Database } from '~/core/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']
type ExerciseWithMuscles = Exercise & {
    exercise_muscles: {
        role: string
        muscle_groups: { slug: string; name_es: string; body_region: string } | null
    }[]
}

export type RoutineSetTemplate = {
    setType: 'warmup' | 'effective'
    reps: string
    technique: 'normal' | 'failure' | 'rest_pause' | 'drop_set'
    restAfterSeconds: number
}

export type RoutineExerciseConfig = {
    exerciseId: string
    exerciseName: string
    sets: RoutineSetTemplate[]
    notesText?: string
}

type Props = {
    initialName?: string
    initialExercises?: RoutineExerciseConfig[]
    allExercises: ExerciseWithMuscles[]
    onSave: (name: string, exercises: RoutineExerciseConfig[]) => Promise<void>
    onCancel: () => void
}

function SortableExerciseRow({
    config, onRemove, onChange
}: {
    config: RoutineExerciseConfig
    onRemove: () => void
    onChange: (updates: Partial<RoutineExerciseConfig>) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: config.exerciseId })

    const style = { transform: CSS.Transform.toString(transform), transition }

    const updateSetRow = (setIdx: number, updates: Partial<RoutineSetTemplate>) => {
        const updated = config.sets.map((s, idx) => idx === setIdx ? { ...s, ...updates } : s)
        onChange({ sets: updated })
    }

    const removeSetRow = (setIdx: number) => {
        const updated = config.sets.filter((_, idx) => idx !== setIdx)
        onChange({ sets: updated })
    }

    const addSetRow = () => {
        const lastSet = config.sets[config.sets.length - 1]
        onChange({
            sets: [
                ...config.sets,
                {
                    setType: 'effective',
                    reps: lastSet?.reps ?? '8-12',
                    technique: lastSet?.technique ?? 'normal',
                    restAfterSeconds: lastSet?.restAfterSeconds ?? 90
                }
            ]
        })
    }

    return (
        <div ref={setNodeRef} style={style} className="flex gap-2 p-4 border rounded-2xl bg-card border-border shadow-sm">
            {/* Drag handle */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="mt-1 text-muted-foreground touch-none shrink-0"
            >
                <GripVertical size={16} />
            </button>

            {/* Config */}
            <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground">{config.exerciseName}</p>
                    {/* Eliminar Ejercicio */}
                    <button
                        type="button"
                        onClick={onRemove}
                        className="transition-colors text-muted-foreground hover:text-destructive"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Lista de series individuales */}
                <div className="space-y-2">
                    {/* Header de columnas */}
                    {config.sets.length > 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                            <div className="w-8 text-center">Serie</div>
                            <div className="w-16 text-center">Reps</div>
                            <div className="flex-1 text-center">Técnica</div>
                            <div className="flex-1 text-center">Descanso</div>
                            <div className="w-6"></div>
                        </div>
                    )}

                    <div className="divide-y divide-border/40 space-y-1.5">
                        {config.sets.map((s, setIdx) => {
                            // Calcular número de serie efectiva secuencial
                            const effectiveIndex = config.sets
                                .slice(0, setIdx)
                                .filter(x => x.setType === 'effective').length + 
                                (s.setType === 'effective' ? 1 : 0)

                            return (
                                <div key={setIdx} className="flex items-center gap-2 pt-1.5 first:pt-0">
                                    {/* Botón tipo serie W/Index */}
                                    <button
                                        type="button"
                                        onClick={() => updateSetRow(setIdx, { setType: s.setType === 'warmup' ? 'effective' : 'warmup' })}
                                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border shrink-0 transition-colors ${
                                            s.setType === 'warmup'
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                : 'bg-primary/10 text-primary border-primary/20'
                                        }`}
                                    >
                                        {s.setType === 'warmup' ? 'W' : effectiveIndex}
                                    </button>

                                    {/* Input de Reps */}
                                    <input
                                        type="text"
                                        value={s.reps}
                                        onChange={e => updateSetRow(setIdx, { reps: e.target.value })}
                                        placeholder="8-12"
                                        className="w-16 px-1.5 py-1 rounded bg-muted border border-border text-center text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />

                                    {/* Selector de Técnica Segmentado */}
                                    <div className="flex border border-border rounded overflow-hidden text-[9px] bg-muted flex-1 shrink-0 justify-around max-w-[130px]">
                                        {(['normal', 'failure', 'rest_pause', 'drop_set'] as const).map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => updateSetRow(setIdx, { technique: t })}
                                                className={`px-1 py-1.5 flex-1 transition-colors font-medium text-center ${
                                                    s.technique === t
                                                        ? 'bg-primary text-primary-foreground font-bold'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {t === 'normal' ? 'N' : t === 'failure' ? 'F' : t === 'rest_pause' ? 'RP' : 'DS'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Selector de Descanso Segmentado */}
                                    <div className="flex border border-border rounded overflow-hidden text-[9px] bg-muted flex-1 shrink-0 justify-around max-w-[120px]">
                                        {[{ label: '1m', value: 60 }, { label: '90s', value: 90 }, { label: '2m', value: 120 }, { label: '3m', value: 180 }].map(ro => (
                                            <button
                                                key={ro.value}
                                                type="button"
                                                onClick={() => updateSetRow(setIdx, { restAfterSeconds: ro.value })}
                                                className={`px-1 py-1.5 flex-1 transition-colors font-medium text-center ${
                                                    s.restAfterSeconds === ro.value
                                                        ? 'bg-secondary text-secondary-foreground font-bold'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {ro.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Eliminar Serie */}
                                    <button
                                        type="button"
                                        onClick={() => removeSetRow(setIdx)}
                                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                                    >
                                        <Trash size={12} />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Botones de acción del ejercicio */}
                <div className="flex gap-2 justify-between items-center pt-1.5">
                    <button
                        type="button"
                        onClick={addSetRow}
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        <Plus size={12} />
                        Añadir serie
                    </button>
                </div>

                {/* Notas/Instrucciones */}
                <div className="space-y-1 pt-1.5 border-t border-border/40">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Instrucciones de ejecución</label>
                    <input
                        type="text"
                        value={config.notesText ?? ''}
                        onChange={e => onChange({ notesText: e.target.value })}
                        placeholder="Ej. Mantener concéntrica lenta, enfoque en estiramiento..."
                        className="w-full px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>
        </div>
    )
}

export function RoutineBuilder({
    initialName = '', initialExercises = [], allExercises, onSave, onCancel
}: Props) {
    const [name, setName] = useState(initialName)
    const [exercises, setExercises] = useState<RoutineExerciseConfig[]>(initialExercises)
    const [showPicker, setShowPicker] = useState(false)
    const [saving, setSaving] = useState(false)

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { delay: 250, tolerance: 5 },
    }))

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const from = exercises.findIndex(ex => ex.exerciseId === active.id)
        const to = exercises.findIndex(ex => ex.exerciseId === over.id)
        if (from === -1 || to === -1) return
        const next = [...exercises]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        setExercises(next)
    }

    const handleAddExercises = (selected: ExerciseWithMuscles[]) => {
        const existing = new Set(exercises.map(e => e.exerciseId))
        const toAdd = selected
            .filter(ex => !existing.has(ex.id))
            .map(ex => ({
                exerciseId: ex.id,
                exerciseName: ex.name_es ?? ex.name,
                sets: [
                    { setType: 'warmup' as const, reps: '12', technique: 'normal' as const, restAfterSeconds: 90 },
                    { setType: 'effective' as const, reps: '8-12', technique: 'normal' as const, restAfterSeconds: 90 },
                    { setType: 'effective' as const, reps: '8-12', technique: 'normal' as const, restAfterSeconds: 90 }
                ],
                notesText: '',
            }))
        setExercises(prev => [...prev, ...toAdd])
    }

    const updateExercise = (idx: number, updates: Partial<RoutineExerciseConfig>) => {
        setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, ...updates } : ex))
    }

    const removeExercise = (idx: number) => {
        setExercises(prev => prev.filter((_, i) => i !== idx))
    }

    const handleSave = async () => {
        if (!name.trim() || exercises.length === 0) return
        setSaving(true)
        await onSave(name.trim(), exercises)
        setSaving(false)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-background border-border">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={16} />
                </button>
                <h1 className="text-base font-bold text-foreground">
                    {initialName ? 'Editar rutina' : 'Nueva rutina'}
                </h1>
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !name.trim() || exercises.length === 0}
                >
                    <Save size={14} />
                    {saving ? 'Guardando...' : 'Guardar'}
                </Button>
            </div>

            <div className="max-w-lg px-4 py-4 pb-24 mx-auto space-y-4">
                {/* Nombre */}
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Nombre de la rutina</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ej: Upper A, Pierna, Full Body..."
                        className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                </div>

                {/* Ejercicios */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                            Ejercicios ({exercises.length})
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowPicker(true)}
                            className="flex items-center gap-1 text-xs font-medium text-primary"
                        >
                            <Plus size={14} />
                            Añadir
                        </button>
                    </div>

                    {exercises.length === 0 ? (
                        <button
                            type="button"
                            onClick={() => setShowPicker(true)}
                            className="flex flex-col items-center justify-center w-full gap-2 py-10 transition-colors border-2 border-dashed rounded-2xl border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        >
                            <Plus size={20} />
                            <span className="text-sm">Añade ejercicios a tu rutina</span>
                        </button>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={exercises.map(ex => ex.exerciseId)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {exercises.map((config, i) => (
                                        <SortableExerciseRow
                                            key={config.exerciseId}
                                            config={config}
                                            onRemove={() => removeExercise(i)}
                                            onChange={(updates) => updateExercise(i, updates)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* Picker de ejercicios */}
            {showPicker && (
                <ExercisePicker
                    exercises={allExercises}
                    alreadyInSession={exercises.map(e => e.exerciseId)}
                    onAdd={handleAddExercises}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    )
}
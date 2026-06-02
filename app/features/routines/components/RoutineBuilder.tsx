import { useState } from 'react'
import { ArrowLeft, Plus, GripVertical, X, Save } from 'lucide-react'
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

export type RoutineExerciseConfig = {
    exerciseId: string
    exerciseName: string
    targetSets: number
    targetReps: string
    targetRir: number | null
    intensityPct: number | null
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

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 border rounded-xl bg-muted border-border">
            {/* Drag handle */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="mt-2 text-muted-foreground touch-none shrink-0"
            >
                <GripVertical size={16} />
            </button>

            {/* Config */}
            <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">{config.exerciseName}</p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                        <label className="text-xs text-muted-foreground">Series</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={config.targetSets}
                            onChange={e => onChange({ targetSets: parseInt(e.target.value) })}
                            min="1"
                            max="10"
                            className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-foreground text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-xs text-muted-foreground">Reps</label>
                        <input
                            type="text"
                            value={config.targetReps}
                            onChange={e => onChange({ targetReps: e.target.value })}
                            placeholder="8-10"
                            className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-foreground text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Eliminar */}
            <button
                type="button"
                onClick={onRemove}
                className="mt-1 transition-colors shrink-0 text-muted-foreground hover:text-destructive"
            >
                <X size={16} />
            </button>
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
                targetSets: 3,
                targetReps: '8-12',
                targetRir: null,
                intensityPct: null,
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
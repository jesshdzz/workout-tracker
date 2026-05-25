import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors,
    type DragEndEvent
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy,
    useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { ExerciseCard } from './ExerciseCard'
import type { SessionExercise } from '../store/session.store'
import type { Database } from '~/core/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

type Props = {
    sessionExercises: SessionExercise[]
    allExercises: Exercise[]
    weightUnit: 'kg' | 'lb'
    onReorder: (from: number, to: number) => void
}

function SortableItem({
    sessionEx,
    exercise,
    weightUnit,
}: {
    sessionEx: SessionExercise
    exercise: Exercise
    weightUnit: 'kg' | 'lb'
}) {
    const {
        attributes, listeners, setNodeRef,
        transform, transition, isDragging,
    } = useSortable({ id: sessionEx.exerciseId })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className="relative">
            {/* Handle de reordenamiento */}
            <button
                {...attributes}
                {...listeners}
                className="absolute z-10 flex items-center justify-center w-6 h-8 -translate-y-1/2 left-2 top-1/2 text-muted-foreground hover:text-foreground touch-none"
            >
                <GripVertical size={14} />
            </button>
            <div className="pl-6">
                <ExerciseCard
                    exercise={exercise}
                    weightUnit={weightUnit}
                    targetSets={2}
                />
            </div>
        </div>
    )
}

export function SortableExerciseList({ sessionExercises, allExercises, weightUnit, onReorder }: Props) {
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
    }))

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const from = sessionExercises.findIndex((ex) => ex.exerciseId === active.id)
        const to = sessionExercises.findIndex((ex) => ex.exerciseId === over.id)
        if (from !== -1 && to !== -1) onReorder(from, to)
    }

    const exerciseMap = new Map(allExercises.map((ex) => [ex.id, ex]))

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={sessionExercises.map((ex) => ex.exerciseId)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3">
                    {sessionExercises.map((sessionEx) => {
                        const exercise = exerciseMap.get(sessionEx.exerciseId)
                        if (!exercise) return null
                        return (
                            <SortableItem
                                key={sessionEx.exerciseId}
                                sessionEx={sessionEx}
                                exercise={exercise}
                                weightUnit={weightUnit}
                            />
                        )
                    })}
                </div>
            </SortableContext>
        </DndContext>
    )
}
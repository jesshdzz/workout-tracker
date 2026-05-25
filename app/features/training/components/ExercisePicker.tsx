import { useRef, useEffect } from 'react'
import { Search, X, Check, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useExercisePicker } from '../hooks/useExercisePicker'
import type { Database } from '~/core/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']
type ExerciseWithMuscles = Exercise & {
    exercise_muscles: {
        role: string
        muscle_groups: { slug: string; name_es: string; body_region: string } | null
    }[]
}

type Props = {
    exercises: ExerciseWithMuscles[]
    alreadyInSession: string[]
    onAdd: (exercises: ExerciseWithMuscles[]) => void
    onClose: () => void
}

export function ExercisePicker({ exercises, alreadyInSession, onAdd, onClose }: Props) {
    const searchRef = useRef<HTMLInputElement>(null)
    const {
        search, setSearch,
        selectedMuscle, setSelectedMuscle,
        muscleGroups,
        filtered,
        selected,
        toggle,
        clearSelection,
        selectedCount,
    } = useExercisePicker(exercises, alreadyInSession)

    // Focus en el input al abrir
    useEffect(() => {
        setTimeout(() => searchRef.current?.focus(), 100)
    }, [])

    const handleAdd = () => {
        const toAdd = exercises.filter((ex) => selected.has(ex.id))
        onAdd(toAdd)
        clearSelection()
        onClose()
    }

    const primaryMuscle = (ex: ExerciseWithMuscles) =>
        ex.exercise_muscles.find((em) => em.role === 'primary')?.muscle_groups?.name_es ?? ''

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
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-border" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-base font-bold text-foreground">Agregar ejercicios</h2>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-muted text-muted-foreground hover:text-foreground"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 pt-3 pb-2">
                    <div className="relative">
                        <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar ejercicio..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute -translate-y-1/2 right-3 top-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtro por músculo */}
                <div className="px-4 pb-3">
                    <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setSelectedMuscle(null)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedMuscle
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
                                }`}
                        >
                            Todos
                        </button>
                        {muscleGroups.map(({ slug, name_es }) => (
                            <button
                                key={slug}
                                onClick={() => setSelectedMuscle(slug === selectedMuscle ? null : slug)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedMuscle === slug
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
                                    }`}
                            >
                                {name_es}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de ejercicios */}
                <div className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-4">
                    {filtered.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-sm text-muted-foreground">No se encontraron ejercicios</p>
                        </div>
                    ) : (
                        filtered.map((exercise) => {
                            const isInSession = alreadyInSession.includes(exercise.id)
                            const isSelected = selected.has(exercise.id)
                            const muscle = primaryMuscle(exercise)

                            return (
                                <button
                                    key={exercise.id}
                                    onClick={() => toggle(exercise.id)}
                                    disabled={isInSession}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${isInSession
                                        ? 'opacity-40 cursor-not-allowed bg-muted'
                                        : isSelected
                                            ? 'bg-primary/10 border border-primary/30'
                                            : 'bg-muted hover:bg-muted/80 border border-transparent'
                                        }`}
                                >
                                    {/* Checkbox */}
                                    <div className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-md border transition-colors ${isInSession
                                        ? 'border-border bg-muted'
                                        : isSelected
                                            ? 'border-primary bg-primary'
                                            : 'border-border bg-card'
                                        }`}>
                                        {isInSession && <Check size={12} className="text-muted-foreground" />}
                                        {isSelected && !isInSession && <Check size={12} className="text-primary-foreground" />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'
                                            }`}>
                                            {exercise.name_es ?? exercise.name}
                                        </p>
                                        {muscle && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{muscle}</p>
                                        )}
                                    </div>

                                    {/* Badges */}
                                    <div className="flex gap-1 shrink-0">
                                        {exercise.is_compound && (
                                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-secondary/10 text-secondary border border-secondary/20">
                                                Compuesto
                                            </span>
                                        )}
                                        {isInSession && (
                                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                                                En sesión
                                            </span>
                                        )}
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>

                {/* Footer con botón de agregar */}
                <div className="px-4 py-4 border-t border-border bg-card">
                    <Button
                        onClick={handleAdd}
                        disabled={selectedCount === 0}
                        className="w-full h-12 font-medium"
                    >
                        <Plus size={16} />
                        {selectedCount === 0
                            ? 'Selecciona ejercicios'
                            : `Agregar ${selectedCount} ejercicio${selectedCount > 1 ? 's' : ''}`
                        }
                    </Button>
                </div>
            </div>
        </>
    )
}
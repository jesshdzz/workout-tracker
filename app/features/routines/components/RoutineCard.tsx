import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Clock, Pencil, Copy, Trash2, ChevronRight } from 'lucide-react'
import { formatRelative } from '~/core/utils/formatters'
import type { RoutineWithExercises } from '~/repositories/routines.repository'

type Props = {
    routine: RoutineWithExercises
    onStart: () => void
    onEdit: () => void
    onRename: () => void
    onDuplicate: () => void
    onDelete: () => void
}

export function RoutineCard({
    routine, onStart, onEdit, onRename, onDuplicate, onDelete
}: Props) {
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Cierra el menú al tocar fuera
    useEffect(() => {
        if (!showMenu) return
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showMenu])

    const exerciseNames = routine.routine_exercises
        .map(re => re.exercises?.name_es ?? re.exercises?.name ?? '')
        .filter(Boolean)
        .slice(0, 4)
        .join(', ')

    const totalExercises = routine.routine_exercises.length
    const preview = totalExercises > 4
        ? `${exerciseNames} y ${totalExercises - 4} más`
        : exerciseNames

    const menuItems = [
        { icon: Pencil, label: 'Editar rutina', action: onEdit, danger: false },
        { icon: Pencil, label: 'Renombrar', action: onRename, danger: false },
        { icon: Copy, label: 'Duplicar', action: onDuplicate, danger: false },
        { icon: Trash2, label: 'Eliminar', action: onDelete, danger: true },
    ]

    return (
        <div className="relative p-4 space-y-3 border rounded-2xl bg-card border-border">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <button
                    type="button"
                    onClick={onStart}
                    className="flex-1 text-left"
                >
                    <p className="text-sm font-bold leading-tight text-foreground">
                        {routine.name}
                    </p>
                </button>

                {/* Menú ··· */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
                        className="flex items-center justify-center transition-colors rounded-full w-7 h-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 z-50 w-48 overflow-hidden border shadow-lg top-8 rounded-xl bg-card border-border">
                            {menuItems.map(({ icon: Icon, label, action, danger }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => { setShowMenu(false); action() }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted ${danger ? 'text-destructive' : 'text-foreground'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Ejercicios */}
            <button type="button" onClick={onStart} className="w-full text-left">
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                    {preview || 'Sin ejercicios'}
                </p>
            </button>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {routine.last_used ? (
                        <>
                            <Clock size={11} />
                            <span>{formatRelative(routine.last_used)}</span>
                        </>
                    ) : (
                        <span>Sin usar</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onStart}
                    className="flex items-center gap-1 text-xs font-medium text-primary"
                >
                    Iniciar
                    <ChevronRight size={12} />
                </button>
            </div>
        </div>
    )
}
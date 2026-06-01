import { Button } from '~/components/ui/button'

type Props = {
    routineName: string
    onConfirm: () => void
    onCancel: () => void
}

export function DeleteRoutineModal({ routineName, onConfirm, onCancel }: Props) {
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-foreground/20 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 space-y-4 border bg-card border-border rounded-t-2xl sm:rounded-2xl">
                <div className="space-y-1">
                    <h2 className="text-base font-bold text-foreground">¿Eliminar rutina?</h2>
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{routineName}</strong> se eliminará permanentemente.
                        El historial de sesiones no se verá afectado.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={onConfirm}>
                        Eliminar
                    </Button>
                </div>
            </div>
        </div>
    )
}
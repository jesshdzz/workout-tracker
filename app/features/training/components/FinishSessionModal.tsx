import { Button } from '~/components/ui/button'
import { Square } from 'lucide-react'

type Props = {
  onConfirm: () => void
  onCancel: () => void
}

export function FinishSessionModal({ onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 flex items-end justify-center z-[60] sm:items-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg p-6 space-y-4 border bg-card rounded-t-2xl sm:rounded-2xl border-border">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">¿Terminar sesión?</h2>
          <p className="text-sm text-muted-foreground">
            Podrás guardarla o descartarla en el siguiente paso.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Seguir entrenando
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
          >
            <Square size={14} />
            Terminar
          </Button>
        </div>
      </div>
    </div>
  )
}
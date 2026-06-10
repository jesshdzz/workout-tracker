import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

type Props = {
  /**
   * Número de filas pendientes (sin completar) en la sesión actual.
   */
  incompleteSetsCount: number
  open: boolean
  /**
   * El usuario quiere guardar igualmente (descartar las series incompletas).
   */
  onConfirm: () => void
  /**
   * El usuario quiere volver a la sesión para completar las series.
   */
  onCancel: () => void
}

/**
 * Modal de confirmación cuando el usuario intenta finalizar la sesión
 * con series pendientes (sin haber pulsado ✓).
 *
 * Usa AlertDialog (destructive confirmation) de shadcn — no modal custom —
 * per skill 'shadcn': AlertDialog es el patrón correcto para acciones con
 * consecuencias (se perderán las series incompletas).
 */
export function IncompleteSetsModal({
  incompleteSetsCount,
  open,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-amber-500" />
            <AlertDialogTitle>Series sin completar</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Tienes{' '}
                <span className="font-semibold text-foreground">
                  {incompleteSetsCount}{' '}
                  {incompleteSetsCount === 1 ? 'serie' : 'series'}
                </span>{' '}
                que no has marcado como completadas.
              </p>
              <p>
                Si guardas ahora, esas series <strong>no se registrarán</strong>{' '}
                en tu historial.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Volver y completar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Guardar igualmente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { WifiOff, RefreshCw } from 'lucide-react'
import { drainQueue } from '~/core/sync/syncQueue'
import { useState } from 'react'

type Props = {
  pendingCount: number
}

export function OfflineBanner({ pendingCount }: Props) {
  const [syncing, setSyncing] = useState(false)

  const handleRetry = async () => {
    setSyncing(true)
    await drainQueue()
    setSyncing(false)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between gap-2 px-4 py-2 bg-destructive text-destructive-foreground text-xs font-medium">
      <div className="flex items-center gap-2">
        <WifiOff size={13} />
        <span>Sin conexión{pendingCount > 0 && ` · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`}</span>
      </div>
      {pendingCount > 0 && navigator.onLine && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={syncing}
          className="flex items-center gap-1 opacity-80 hover:opacity-100"
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          Sincronizar
        </button>
      )}
    </div>
  )
}
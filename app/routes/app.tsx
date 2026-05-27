import { useOnlineSync } from '~/core/sync/useOnlineSync'
import { OfflineBanner } from '~/shared/components/OfflineBanner'
import { BottomNav } from '~/shared/components/BottomNav'
import { Outlet } from 'react-router'

export default function AppLayout() {
  const { isOnline, pendingCount } = useOnlineSync()

  return (
    <div className="min-h-screen pb-16 bg-background">
      {!isOnline && <OfflineBanner pendingCount={pendingCount} />}
      <Outlet />
      <BottomNav />
    </div>
  )
}
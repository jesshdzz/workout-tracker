import { useOnlineSync } from '~/core/sync/useOnlineSync'
import { OfflineBanner } from '~/shared/components/OfflineBanner'
import { BottomNav } from '~/shared/components/BottomNav'
import { OnboardingModal } from '~/features/onboarding/components/OnboardingModal'
import { useAppModeStore } from '~/features/onboarding/store/appMode.store'
import { Outlet } from 'react-router'

export default function AppLayout() {
  const { isOnline, pendingCount } = useOnlineSync()
  const mode = useAppModeStore((s) => s.mode)

  return (
    <div className="min-h-screen pb-16 bg-background">
      {!isOnline && <OfflineBanner pendingCount={pendingCount} />}
      {/* Onboarding en primer acceso — se muestra mientras mode === null */}
      {mode === null && <OnboardingModal />}
      <Outlet />
      <BottomNav />
    </div>
  )
}
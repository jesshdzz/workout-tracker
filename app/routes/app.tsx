import type { Route } from './+types/app'
import { Outlet } from 'react-router'
import { requireAuth } from '~/lib/auth'
import { BottomNav } from '~/shared/components/BottomNav'

export async function loader(_: Route.LoaderArgs) {
  await requireAuth()
  return {}
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="max-w-lg mx-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
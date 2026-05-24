import type { Route } from './+types/app'
import { Outlet } from 'react-router'
import { requireAuth } from '~/lib/auth.server'
import { BottomNav } from '~/shared/components/BottomNav'

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth()
  return { user }
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen pb-20 bg-bg">
      <Outlet />
      <BottomNav />
    </div>
  )
}
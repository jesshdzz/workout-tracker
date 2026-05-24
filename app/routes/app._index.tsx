// app/routes/app._index.tsx
import type { Route } from './+types/app._index'
import { requireAuth } from '~/lib/auth.server'
import { useDashboard } from '~/features/dashboard/hooks/useDashboard'
import { BlockProgress } from '~/features/dashboard/components/BlockProgress'
import { WeekCard } from '~/features/dashboard/components/WeekCard'
import { RecentSessions } from '~/features/dashboard/components/RecentSessions'
import { PRCard } from '~/features/dashboard/components/PRCard'

export async function loader() {
  await requireAuth()
  // currentWeek vendría del user_program_state — por ahora lo dejamos en 1
  // cuando implementemos el perfil completo lo leeremos de Supabase
  return { currentWeek: 1 }
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  const { currentWeek } = loaderData
  const {
    activeSession,
    recentSessions,
    recentPRs,
    loading,
    error,
  } = useDashboard(currentWeek)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="w-6 h-6 border-2 rounded-full animate-spin border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-bg">
        <p className="text-sm text-center text-danger">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-4 bg-bg">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Bienvenido de vuelta</p>
      </div>

      <BlockProgress currentWeek={currentWeek} />
      <WeekCard activeSession={activeSession} />
      <RecentSessions sessions={recentSessions} />
      <PRCard prs={recentPRs} />
    </div>
  )
}
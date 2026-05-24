import { useEffect, useState } from 'react'
import { sessionsRepository } from '~/repositories/sessions.repository'
import { rmsRepository } from '~/repositories/rms.repository'
import { recordsRepository } from '~/repositories/records.repository'
import { getBlockConfig } from '~/core/utils/periodization'
import { useAuth } from '~/features/auth/AuthProvider'
import type { Database } from '~/core/types/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type PR = Database['public']['Tables']['personal_records']['Row']

type DashboardData = {
  activeSession: Session | null
  recentSessions: Session[]
  totalSessions: number
  currentWeek: number
  recentPRs: PR[]
  loading: boolean
  error: string | null
}

export function useDashboard(currentWeek: number): DashboardData {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [recentPRs, setRecentPRs] = useState<PR[]>([])

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)
      setError(null)

      const [activeResult, sessionsResult, prsResult] = await Promise.all([
        sessionsRepository.findActive(user.id),
        sessionsRepository.findByUser(user.id, 5),
        recordsRepository.findByUser(user.id),
      ])

      if (sessionsResult.error) {
        setError('Error al cargar las sesiones')
        setLoading(false)
        return
      }

      setActiveSession(activeResult.data)
      setRecentSessions(sessionsResult.data ?? [])
      setRecentPRs((prsResult.data ?? []).slice(0, 3))
      setLoading(false)
    }

    load()
  }, [user])

  return {
    activeSession,
    recentSessions,
    totalSessions: recentSessions.length,
    currentWeek,
    recentPRs,
    loading,
    error,
  }
}
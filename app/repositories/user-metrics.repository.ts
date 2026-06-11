// app/repositories/user-metrics.repository.ts
import { supabase } from '~/lib/supabase'
import { BaseRepository } from './base.repository'
import type { Result } from '~/core/types/common.types'
import type { Database } from '~/core/types/database.types'

type UserMetrics = Database['public']['Tables']['user_metrics']['Row']
type UserMetricsInsert = Database['public']['Tables']['user_metrics']['Insert']
type UserMetricsUpdate = Database['public']['Tables']['user_metrics']['Update']

// Typed goals JSON structure
export type UserGoals = {
  build_muscle?: boolean
  lose_fat?: boolean
  increase_strength?: boolean
  maintain_bf_range?: boolean
  target_bf_pct?: number
}

export class UserMetricsRepository extends BaseRepository {
  /** Obtiene la entrada de métricas más reciente del usuario */
  async findByUser(userId: string): Promise<Result<UserMetrics>> {
    const { data, error } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return this.handle(data, error)
  }

  /** Crea una nueva entrada de métricas (se mantiene historial) */
  async create(metrics: UserMetricsInsert): Promise<Result<UserMetrics>> {
    const { data, error } = await supabase
      .from('user_metrics')
      .insert(metrics)
      .select()
      .single()
    return this.handle(data, error)
  }

  /** Actualiza la entrada más reciente de métricas */
  async update(id: string, updates: UserMetricsUpdate): Promise<Result<UserMetrics>> {
    const { data, error } = await supabase
      .from('user_metrics')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return this.handle(data, error)
  }

  /** Obtiene el historial de métricas del usuario (para mostrar evolución) */
  async getHistory(userId: string, limit = 10): Promise<Result<UserMetrics[]>> {
    const { data, error } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return this.handle(data, error)
  }
}

export const userMetricsRepository = new UserMetricsRepository()

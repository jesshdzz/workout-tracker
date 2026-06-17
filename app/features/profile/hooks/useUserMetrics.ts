// app/features/profile/hooks/useUserMetrics.ts
import { useEffect, useState } from 'react'
import { useAuth } from '~/features/auth/AuthProvider'
import {
  userMetricsRepository,
  type UserGoals,
} from '~/repositories/user-metrics.repository'
import { aiProgramStatesRepository } from '~/repositories/ai-program-states.repository'
import type { Database } from '~/core/types/database.types'

type UserMetrics = Database['public']['Tables']['user_metrics']['Row']

export type MetricsForm = {
  weight_kg: string
  height_cm: string
  body_fat_pct: string
  somatotype: string
  avg_sleep_hours: string
  hydration_liters: string
  diet_status: string
  daily_protein_g: string
  experience_years: string
  weight_unit: 'kg' | 'lb'
  goals: UserGoals
  weak_muscles: string[]
  priority_muscles: string[]
  use_periodization: boolean
}

const EMPTY_FORM: MetricsForm = {
  weight_kg: '',
  height_cm: '',
  body_fat_pct: '',
  somatotype: '',
  avg_sleep_hours: '',
  hydration_liters: '',
  diet_status: '',
  daily_protein_g: '',
  experience_years: '',
  weight_unit: 'kg',
  goals: {},
  weak_muscles: [],
  priority_muscles: [],
  use_periodization: true,
}

function metricsToForm(m: UserMetrics): MetricsForm {
  return {
    weight_kg: m.weight_kg?.toString() ?? '',
    height_cm: m.height_cm?.toString() ?? '',
    body_fat_pct: m.body_fat_pct?.toString() ?? '',
    somatotype: m.somatotype ?? '',
    avg_sleep_hours: m.avg_sleep_hours?.toString() ?? '',
    hydration_liters: m.hydration_liters?.toString() ?? '',
    diet_status: m.diet_status ?? '',
    daily_protein_g: m.daily_protein_g?.toString() ?? '',
    experience_years: m.experience_years?.toString() ?? '',
    weight_unit: (m.weight_unit as 'kg' | 'lb') ?? 'kg',
    goals: (m.goals as UserGoals) ?? {},
    weak_muscles: m.weak_muscles ?? [],
    priority_muscles: m.priority_muscles ?? [],
    use_periodization: m.use_periodization ?? true,
  }
}

export function useUserMetrics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<UserMetrics | null>(null)
  const [form, setForm] = useState<MetricsForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    const result = await userMetricsRepository.findByUser(user!.id)
    if (result.data) {
      setMetrics(result.data)
      setForm(metricsToForm(result.data))
    }
    setLoading(false)
  }

  const updateField = <K extends keyof MetricsForm>(field: K, value: MetricsForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleMuscle = (list: 'weak_muscles' | 'priority_muscles', muscle: string) => {
    setForm(prev => {
      const current = prev[list]
      const updated = current.includes(muscle)
        ? current.filter(m => m !== muscle)
        : [...current, muscle]
      return { ...prev, [list]: updated }
    })
  }

  const toggleGoal = (goal: keyof UserGoals, value: boolean) => {
    setForm(prev => ({
      ...prev,
      goals: { ...prev.goals, [goal]: value },
    }))
  }

  const saveMetrics = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    const payload = {
      user_id: user.id,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
      somatotype: form.somatotype || null,
      avg_sleep_hours: form.avg_sleep_hours ? parseFloat(form.avg_sleep_hours) : null,
      hydration_liters: form.hydration_liters ? parseFloat(form.hydration_liters) : null,
      diet_status: form.diet_status || null,
      daily_protein_g: form.daily_protein_g ? parseFloat(form.daily_protein_g) : null,
      experience_years: form.experience_years ? parseFloat(form.experience_years) : null,
      weight_unit: form.weight_unit,
      goals: form.goals,
      weak_muscles: form.weak_muscles,
      priority_muscles: form.priority_muscles,
      use_periodization: form.use_periodization,
    }

    let result
    if (metrics) {
      result = await userMetricsRepository.update(metrics.id, payload)
    } else {
      result = await userMetricsRepository.create(payload)
    }

    if (result.error) {
      setError('Error al guardar las métricas')
    } else if (result.data) {
      setMetrics(result.data)

      // Solo inicializar el programa si el usuario quiere periodización
      if (form.use_periodization) {
        const stateRes = await aiProgramStatesRepository.findByUser(user.id)
        if (!stateRes.data) {
          await aiProgramStatesRepository.initialize(user.id)
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }

    setSaving(false)
  }

  return {
    metrics,
    form,
    loading,
    saving,
    saved,
    error,
    updateField,
    toggleMuscle,
    toggleGoal,
    saveMetrics,
  }
}

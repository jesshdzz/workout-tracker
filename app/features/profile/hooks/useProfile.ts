import { useEffect, useState } from 'react'
import { useAuth } from '~/features/auth/AuthProvider'
import { calcRM } from '~/core/utils/epley'
import type { Database } from '~/core/types/database.types'
import { profilesRepository } from '~/repositories/profiles.repository'
import { rmsRepository } from '~/repositories/rms.repository'

type Profile = Database['public']['Tables']['profiles']['Row']

export type RMEntry = {
    exerciseId: string
    exerciseName: string
    rmKg: number
    testedAt: string | null
}

export function useProfile() {
    const { user, signOut } = useAuth()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [rms, setRMs] = useState<RMEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        load()
    }, [user])

    const load = async () => {
        setLoading(true)

        const [profileRes, rmsRes] = await Promise.all([
            profilesRepository.findByUserId(user!.id),
            rmsRepository.findByUser(user!.id, 'rm_kg', false),
        ])

        if (profileRes.data) setProfile(profileRes.data)

        setRMs(
            (rmsRes.data ?? []).map((rm: any) => ({
                exerciseId: rm.exercise_id,
                exerciseName: rm.exercises?.name_es ?? rm.exercises?.name ?? 'Ejercicio',
                rmKg: rm.rm_kg,
                testedAt: rm.tested_at,
            }))
        )

        setLoading(false)
    }

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return
        setSaving(true)
        setError(null)

        const { data, error } = await profilesRepository.update(user.id, { ...updates, updated_at: new Date().toISOString() })

        if (error) setError('Error al guardar el perfil')
        else if (data) setProfile(data)

        setSaving(false)
    }

    const saveRM = async (exerciseId: string, rmKg: number) => {
        if (!user) return
        const result = await rmsRepository.upsert({
            user_id: user.id,
            exercise_id: exerciseId,
            rm_kg: rmKg,
            tested_at: new Date().toISOString().split('T')[0],
        })
        if (!result.error) await load()
    }

    return { profile, rms, loading, saving, error, updateProfile, saveRM, signOut }
}
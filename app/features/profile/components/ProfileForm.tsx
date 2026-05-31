import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { User, Weight, Ruler } from 'lucide-react'
import type { Database } from '~/core/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

type Props = {
    profile: Profile
    saving: boolean
    onSave: (updates: Partial<Profile>) => void
}

export function ProfileForm({ profile, saving, onSave }: Props) {
    const [form, setForm] = useState({
        full_name: profile.full_name ?? '',
        username: profile.username ?? '',
        weight_kg: profile.weight_kg?.toString() ?? '',
        height_cm: profile.height_cm?.toString() ?? '',
    })

    useEffect(() => {
        setForm({
            full_name: profile.full_name ?? '',
            username: profile.username ?? '',
            weight_kg: profile.weight_kg?.toString() ?? '',
            height_cm: profile.height_cm?.toString() ?? '',
        })
    }, [profile])

    const update = (field: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }))

    const handleSave = () => {
        onSave({
            full_name: form.full_name || null,
            username: form.username,
            weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
            height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        })
    }

    const fields = [
        { label: 'Nombre completo', field: 'full_name' as const, placeholder: 'Tu nombre', type: 'text', icon: User },
        { label: 'Usuario', field: 'username' as const, placeholder: '@usuario', type: 'text', icon: User },
        { label: 'Peso (kg)', field: 'weight_kg' as const, placeholder: '80', type: 'number', icon: Weight },
        { label: 'Altura (cm)', field: 'height_cm' as const, placeholder: '170', type: 'number', icon: Ruler },
    ]

    return (
        <div className="p-4 space-y-4 border rounded-2xl bg-card border-border">
            <p className="text-sm font-medium text-foreground">Datos personales</p>
            <div className="space-y-3">
                {fields.map(({ label, field, placeholder, type }) => (
                    <div key={field} className="space-y-1">
                        <label className="text-xs text-muted-foreground">{label}</label>
                        <input
                            type={type}
                            value={form[field]}
                            onChange={update(field)}
                            placeholder={placeholder}
                            inputMode={type === 'number' ? 'decimal' : undefined}
                            className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>
                ))}
            </div>
            <Button
                onClick={handleSave}
                disabled={saving || !form.username}
                className="w-full"
            >
                {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
        </div>
    )
}
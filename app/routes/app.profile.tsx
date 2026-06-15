import type { Route } from './+types/app.profile'
import { requireAuth } from '~/lib/auth'
import { useProfile } from '~/features/profile/hooks/useProfile'
import { ProfileForm } from '~/features/profile/components/ProfileForm'
import { RMSettings } from '~/features/profile/components/RMSettings'
import { UserMetricsForm } from '~/features/profile/components/UserMetricsForm'
import { AppModeSelector } from '~/features/onboarding/components/AppModeSelector'
import { Button } from '~/components/ui/button'
import { LogOut } from 'lucide-react'

export async function clientLoader(_: Route.LoaderArgs) {
    await requireAuth()
    return {}
}

export default function ProfileRoute() {
    const { profile, rms, loading, saving, error, updateProfile, saveRM, signOut } = useProfile()

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-6 h-6 border-2 rounded-full animate-spin border-primary border-t-transparent" />
        </div>
    )

    return (
        <div className="max-w-lg min-h-screen px-4 py-6 mx-auto space-y-4 bg-background">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {profile?.username ? `@${profile.username}` : 'Sin usuario'}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                >
                    <LogOut size={14} />
                    Salir
                </Button>
            </div>

            {error && (
                <div className="px-4 py-3 text-sm border rounded-xl bg-destructive/10 border-destructive/20 text-destructive">
                    {error}
                </div>
            )}

            {/* Datos básicos de cuenta */}
            {profile && (
                <ProfileForm
                    profile={profile}
                    saving={saving}
                    onSave={updateProfile}
                />
            )}

            {/* Perfil avanzado del atleta — alimenta al Motor IA */}
            <UserMetricsForm />

            <AppModeSelector />

            <RMSettings rms={rms} onSaveRM={saveRM} />

        </div>
    )
}
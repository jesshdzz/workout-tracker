import { useState } from 'react'
import type { Route } from './+types/app.progress'
import { requireAuth } from '~/lib/auth'
import { useProgress } from '~/features/progress/hooks/useProgress'
import { PRList } from '~/features/progress/components/PRList'
import { ProgressChart } from '~/features/progress/components/ProgressChart'
import { SessionHistory } from '~/features/progress/components/SessionHistory'

export async function clientLoader(_: Route.LoaderArgs) {
    await requireAuth()
    return {}
}

type Tab = 'prs' | 'graficas' | 'historial'

export default function ProgressRoute() {
    const {
        prs, exerciseProgress, recentSessions,
        totalSessions, totalPRs, loading, error,
    } = useProgress()

    const [tab, setTab] = useState<Tab>('prs')
    const [selectedExercise, setSelected] = useState<string | null>(null)

    const currentChart = selectedExercise
        ? exerciseProgress.find(e => e.exerciseId === selectedExercise)
        : exerciseProgress[0]

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-6 h-6 border-2 rounded-full animate-spin border-primary border-t-transparent" />
        </div>
    )

    if (error) return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-background">
            <p className="text-sm text-center text-destructive">{error}</p>
        </div>
    )

    return (
        <div className="max-w-lg min-h-screen px-4 py-6 mx-auto space-y-4 bg-background">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Progreso</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Tu evolución en el tiempo</p>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'Sesiones', value: totalSessions },
                    { label: 'PRs', value: totalPRs },
                    { label: 'Ejercicios', value: prs.length },
                ].map(({ label, value }) => (
                    <div key={label} className="p-3 space-y-1 text-center border rounded-2xl bg-card border-border">
                        <p className="font-mono text-xl font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex p-1 rounded-xl bg-muted">
                {([
                    { value: 'prs', label: 'PRs' },
                    { value: 'graficas', label: 'Gráficas' },
                    { value: 'historial', label: 'Historial' },
                ] as { value: Tab; label: string }[]).map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => setTab(t.value)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === t.value
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Contenido por tab */}
            {tab === 'prs' && <PRList prs={prs} />}

            {tab === 'graficas' && (
                <div className="space-y-4">
                    {exerciseProgress.length === 0 ? (
                        <div className="p-8 text-center border rounded-2xl bg-card border-border">
                            <p className="text-sm text-muted-foreground">
                                Necesitas al menos 2 sesiones con el mismo ejercicio para ver gráficas
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Selector de ejercicio */}
                            <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
                                {exerciseProgress.map((ex) => (
                                    <button
                                        key={ex.exerciseId}
                                        type="button"
                                        onClick={() => setSelected(ex.exerciseId)}
                                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${(selectedExercise ?? exerciseProgress[0]?.exerciseId) === ex.exerciseId
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card text-muted-foreground border border-border hover:text-foreground'
                                            }`}
                                    >
                                        {ex.exerciseName}
                                    </button>
                                ))}
                            </div>
                            {currentChart && <ProgressChart data={currentChart} />}
                        </>
                    )}
                </div>
            )}

            {tab === 'historial' && <SessionHistory sessions={recentSessions} />}

        </div>
    )
}
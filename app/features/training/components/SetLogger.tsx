import { useState } from 'react'
import { Trophy, Check } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { WeightUnit } from '~/core/types/common.types'

type Props = {
    exerciseId: string
    exerciseName: string
    setNumber: number
    setType: 'warmup' | 'effective'
    suggestedWeight?: number
    suggestedReps?: string
    weightUnit: WeightUnit
    onLog: (data: {
        weight: number
        reps: number
        rirPerceived: number
        restAfterSeconds: number
    }) => Promise<{ isPR: boolean } | null>
}

const RIR_OPTIONS = [0, 1, 2, 3, 4]
const REST_OPTIONS = [
    { label: '1m', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
]

export function SetLogger({
    exerciseId,
    exerciseName,
    setNumber,
    setType,
    suggestedWeight,
    suggestedReps,
    weightUnit,
    onLog,
}: Props) {
    const [weight, setWeight] = useState(suggestedWeight?.toString() ?? '')
    const [reps, setReps] = useState('')
    const [rir, setRir] = useState(2)
    const [rest, setRest] = useState(90)
    const [loading, setLoading] = useState(false)
    const [logged, setLogged] = useState(false)
    const [wasPR, setWasPR] = useState(false)

    const handleLog = async () => {
        const w = parseFloat(weight)
        const r = parseInt(reps)
        if (!w || !r) return

        setLoading(true)
        const result = await onLog({
            weight: w,
            reps: r,
            rirPerceived: rir,
            restAfterSeconds: rest,
        })
        setLoading(false)

        if (result) {
            setLogged(true)
            setWasPR(result.isPR)
        }
    }

    if (logged) {
        return (
            <div className="flex items-center justify-center gap-2 py-2">
                <Check size={16} className="text-accent" />
                <span className="text-sm text-accent font-medium">Serie registrada</span>
                {wasPR && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Trophy size={12} /> PR
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Peso ({weightUnit})</label>
                    <Input
                        type="number"
                        placeholder={suggestedWeight?.toString() ?? '0'}
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        step="0.5"
                        min="0"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
                    <Input
                        type="number"
                        placeholder={suggestedReps ?? '0'}
                        value={reps}
                        onChange={e => setReps(e.target.value)}
                        min="0"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">RIR</label>
                <div className="flex gap-1.5">
                    {RIR_OPTIONS.map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRir(r)}
                            className={`flex-1 h-8 text-xs font-medium rounded-lg transition-colors ${
                                rir === r
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                            }`}
                        >
                            {r === 0 ? 'Al fallo' : r}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Descanso</label>
                <div className="flex gap-1.5">
                    {REST_OPTIONS.map(r => (
                        <button
                            key={r.value}
                            type="button"
                            onClick={() => setRest(r.value)}
                            className={`flex-1 h-8 text-xs font-medium rounded-lg transition-colors ${
                                rest === r.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <Button
                onClick={handleLog}
                disabled={loading || !weight || !reps}
                className="w-full"
                size="sm"
            >
                {loading ? 'Guardando...' : `Guardar serie ${setNumber}`}
            </Button>
        </div>
    )
}

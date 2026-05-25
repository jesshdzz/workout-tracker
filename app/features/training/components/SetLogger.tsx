import { useState } from 'react'
import { Trophy, Check, ChevronDown } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { WeightUnit } from '~/core/types/common.types'

type Technique = 'normal' | 'rest_pause' | 'drop_set' | 'failure'

type Props = {
    exerciseId: string
    exerciseName: string
    setNumber: number
    setType: 'warmup' | 'effective'
    suggestedWeight?: number
    weightUnit: WeightUnit
    onLog: (data: {
        weight: number
        reps: number
        technique: Technique
        restPauseReps?: number
        dropWeight?: number
        dropReps?: number
        rirPerceived: number
        restAfterSeconds: number
        setType: 'warmup' | 'effective'
        weightUnit: WeightUnit
    }) => Promise<{ isPR: boolean } | null>
}

const TECHNIQUES: { value: Technique; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'failure', label: 'Al fallo' },
    { value: 'rest_pause', label: 'Rest-pause' },
    { value: 'drop_set', label: 'Drop-set' },
]

const RIR_OPTIONS = [0, 1, 2, 3, 4]
const REST_OPTIONS = [
    { label: '1m', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
]

function NumberInput({
    label, value, onChange, placeholder, step = '1', min = '0'
}: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    step?: string
    min?: string
}) {
    return (
        <div className="flex-1 space-y-1">
            <label className="block text-xs text-muted-foreground">{label}</label>
            <input
                type="number"
                inputMode="decimal"
                placeholder={placeholder ?? '0'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={step}
                min={min}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-center font-mono text-lg font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
        </div>
    )
}

export function SetLogger({
    exerciseId, exerciseName, setNumber,
    setType: initialSetType, suggestedWeight, weightUnit, onLog,
}: Props) {
    const [currentSetType, setCurrentSetType] = useState(initialSetType)
    const [currentWeightUnit, setCurrentWeightUnit] = useState<WeightUnit>(weightUnit)
    const [technique, setTechnique] = useState<Technique>('normal')
    const [weight, setWeight] = useState(suggestedWeight?.toString() ?? '')
    const [reps, setReps] = useState('')
    const [rpReps, setRpReps] = useState('')        // rest-pause extra reps
    const [dropWeight, setDropWeight] = useState('')      // drop-set peso reducido
    const [dropReps, setDropReps] = useState('')        // drop-set reps extra
    const [rir, setRir] = useState(2)
    const [rest, setRest] = useState(90)
    const [loading, setLoading] = useState(false)
    const [logged, setLogged] = useState(false)
    const [wasPR, setWasPR] = useState(false)

    const isValid = () => {
        if (!weight || !reps) return false
        if (technique === 'rest_pause' && !rpReps) return false
        if (technique === 'drop_set' && (!dropWeight || !dropReps)) return false
        return true
    }

    const handleLog = async () => {
        if (!isValid()) return
        setLoading(true)

        const result = await onLog({
            weight: parseFloat(weight),
            reps: parseInt(reps),
            technique,
            restPauseReps: technique === 'rest_pause' ? parseInt(rpReps) : undefined,
            dropWeight: technique === 'drop_set' ? parseFloat(dropWeight) : undefined,
            dropReps: technique === 'drop_set' ? parseInt(dropReps) : undefined,
            rirPerceived: technique === 'failure' ? 0 : rir,
            restAfterSeconds: rest,
            setType: currentSetType,
            weightUnit: currentWeightUnit,
        })

        setLoading(false)
        if (result) { setLogged(true); setWasPR(result.isPR) }
    }

    if (logged) {
        return (
            <div className="flex items-center justify-center gap-2 py-2">
                <Check size={16} className="text-accent" />
                <span className="text-sm font-medium text-accent">Serie registrada</span>
                {wasPR && (
                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                        <Trophy size={12} /> PR
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className="p-3 space-y-3 border rounded-xl bg-muted/50 border-border">

            {/* Fila superior: tipo de serie + unidad de peso */}
            <div className="flex gap-2">
                <div className="flex flex-1 overflow-hidden border rounded-lg border-border">
                    {(['warmup', 'effective'] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setCurrentSetType(type)}
                            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${currentSetType === type
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {type === 'warmup' ? 'Calentamiento' : 'Efectiva'}
                        </button>
                    ))}
                </div>
                <div className="flex overflow-hidden border rounded-lg border-border">
                    {(['kg', 'lb'] as const).map((unit) => (
                        <button
                            key={unit}
                            type="button"
                            onClick={() => setCurrentWeightUnit(unit)}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${currentWeightUnit === unit
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {unit}
                        </button>
                    ))}
                </div>
            </div>

            {/* Técnica */}
            <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Técnica</label>
                <div className="flex gap-1.5 flex-wrap">
                    {TECHNIQUES.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setTechnique(t.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${technique === t.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground border border-border hover:text-foreground'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Peso y Reps principales */}
            <div className="flex gap-2">
                <NumberInput
                    label={`Peso (${currentWeightUnit})`}
                    value={weight}
                    onChange={setWeight}
                    placeholder={suggestedWeight?.toString() ?? '0'}
                    step="0.5"
                />
                <NumberInput
                    label="Reps"
                    value={reps}
                    onChange={setReps}
                    placeholder="0"
                />
            </div>

            {/* Rest-pause: reps extra */}
            {technique === 'rest_pause' && (
                <div className="p-3 space-y-2 border rounded-lg border-primary/20 bg-primary/5">
                    <p className="text-xs font-medium text-primary">Rest-pause</p>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-center text-muted-foreground">
                            <span className="font-mono text-foreground">{weight || '?'}</span>
                            <br />reps ini.
                        </div>
                        <div className="flex-1 border-t border-dashed border-border" />
                        <div className="text-xs text-muted-foreground">pausa</div>
                        <div className="flex-1 border-t border-dashed border-border" />
                        <div className="w-20">
                            <NumberInput
                                label="Reps extra"
                                value={rpReps}
                                onChange={setRpReps}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Drop-set: peso reducido y reps extra */}
            {technique === 'drop_set' && (
                <div className="p-3 space-y-2 border rounded-lg border-secondary/20 bg-secondary/5">
                    <p className="text-xs font-medium text-secondary">Drop-set</p>
                    <div className="grid grid-cols-2 gap-2">
                        <NumberInput
                            label={`Peso drop (${currentWeightUnit})`}
                            value={dropWeight}
                            onChange={setDropWeight}
                            placeholder="0"
                            step="0.5"
                        />
                        <NumberInput
                            label="Reps drop"
                            value={dropReps}
                            onChange={setDropReps}
                            placeholder="0"
                        />
                    </div>
                </div>
            )}

            {/* RIR — oculto si es "al fallo" */}
            {technique !== 'failure' && (
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">RIR percibido</label>
                    <div className="flex gap-1.5">
                        {RIR_OPTIONS.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRir(r)}
                                className={`flex-1 h-8 text-xs font-medium rounded-lg transition-colors ${rir === r
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card text-muted-foreground border border-border hover:text-foreground'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Descanso */}
            <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Descanso</label>
                <div className="flex gap-1.5">
                    {REST_OPTIONS.map((r) => (
                        <button
                            key={r.value}
                            type="button"
                            onClick={() => setRest(r.value)}
                            className={`flex-1 h-8 text-xs font-medium rounded-lg transition-colors ${rest === r.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground border border-border hover:text-foreground'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <Button
                onClick={handleLog}
                disabled={loading || !isValid()}
                className="w-full"
                size="sm"
            >
                {loading ? 'Guardando...' : `Guardar serie ${setNumber}`}
            </Button>
        </div>
    )
}
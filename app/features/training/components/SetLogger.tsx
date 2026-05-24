import { useState } from 'react'
import { Trophy } from 'lucide-react'
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
const REST_OPTIONS = [{ label: '1m', value: 60 }, { label: '90s', value: 90 }, { label: '2m', value: 120 }, { label: '3m', value: 180 }]

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
    
    return (<></>);
}
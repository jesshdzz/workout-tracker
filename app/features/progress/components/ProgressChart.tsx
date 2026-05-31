import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { formatDateShort } from '~/core/utils/formatters'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ExerciseProgressData } from '../hooks/useProgress'

type Props = {
    data: ExerciseProgressData
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="px-3 py-2 text-xs border rounded-lg shadow-md bg-card border-border">
            <p className="text-muted-foreground">{formatDateShort(label)}</p>
            <p className="text-primary font-bold mt-0.5 font-mono">
                {payload[0].value.toFixed(1)} kg RM
            </p>
        </div>
    )
}

export function ProgressChart({ data }: Props) {
    const gain = data.currentRM - data.firstRM
    const gainPct = ((gain / data.firstRM) * 100).toFixed(1)
    const isPositive = gain > 0
    const isNeutral = gain === 0

    const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
    const trendColor = isNeutral
        ? 'text-muted-foreground'
        : isPositive
            ? 'text-accent'
            : 'text-destructive'

    return (
        <div className="overflow-hidden border rounded-2xl bg-card border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">{data.exerciseName}</p>
                <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
                    <TrendIcon size={12} />
                    <span>
                        {isPositive ? '+' : ''}{gain.toFixed(1)} kg ({gainPct}%)
                    </span>
                </div>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-3 border-b divide-x divide-border border-border">
                {[
                    { label: 'Inicial', value: `${data.firstRM.toFixed(1)} kg` },
                    { label: 'Actual', value: `${data.currentRM.toFixed(1)} kg` },
                    { label: 'Sesiones', value: data.points.length.toString() },
                ].map(({ label, value }) => (
                    <div key={label} className="py-2 text-center">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-bold font-mono text-foreground mt-0.5">{value}</p>
                    </div>
                ))}
            </div>

            {/* Gráfica */}
            <div className="p-4">
                <ResponsiveContainer width="100%" height={130}>
                    <LineChart
                        data={data.points}
                        margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatDateShort}
                            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="rm"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
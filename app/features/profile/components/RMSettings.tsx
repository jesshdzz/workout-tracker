import { useState } from 'react'
import { calcRM, calcWorkingWeight } from '~/core/utils/epley'
import { formatDateShort } from '~/core/utils/formatters'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { RMEntry } from '../hooks/useProfile'

type Props = { rms: RMEntry[] }

export function RMSettings({ rms }: Props) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [currentWeightType, setCurrentWeightType] = useState<'kg' | 'lb'>('kg')
  const [showCalc, setShowCalc] = useState(false)

  const estimated = weight && reps
    ? calcRM(parseFloat(weight), parseInt(reps))
    : null

  const INTENSITIES = [
    { pct: 0.65, label: 'Bloque 1 (65%)' },
    { pct: 0.78, label: 'Bloque 2 (78%)' },
    { pct: 0.88, label: 'Bloque 3 (88%)' },
  ]

  return (
    <div className="space-y-3">
      {/* Lista de RMs */}
      <div className="overflow-hidden border rounded-2xl bg-card border-border">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">RMs registrados</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se actualizan automáticamente al batir un récord
          </p>
        </div>

        {rms.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay RMs. Se calculan automáticamente cuando bates una marca.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rms.map((rm) => (
              <li key={rm.exerciseId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-foreground">{rm.exerciseName}</p>
                  {rm.testedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateShort(rm.testedAt)}
                    </p>
                  )}
                </div>
                <p className="font-mono text-base font-bold text-primary">
                  {rm.rmKg.toFixed(1)} kg
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Calculadora */}
      <div className="overflow-hidden border rounded-2xl bg-card border-border">
        <button
          type="button"
          onClick={() => setShowCalc(!showCalc)}
          className="flex items-center justify-between w-full px-4 py-3"
        >
          <p className="text-sm font-medium text-foreground">Calculadora de RM</p>
          {showCalc
            ? <ChevronUp size={16} className="text-muted-foreground" />
            : <ChevronDown size={16} className="text-muted-foreground" />
          }
        </button>

        {showCalc && (
          <div className="px-4 pt-3 pb-4 space-y-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Fórmula de Epley: RM = Peso × (1 + Reps / 30)
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Peso (kg / lb)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="80"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm text-center border rounded-xl bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Reps</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="8"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm text-center border rounded-xl bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {estimated && (
              <div className="space-y-2">
                <div className="p-3 text-center border rounded-xl bg-primary/10 border-primary/20">
                  <p className="text-xs text-muted-foreground">1RM estimado</p>
                  <p className="text-3xl font-bold font-mono text-primary mt-0.5">
                    {estimated.toFixed(1)} {currentWeightType}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pt-2 rounded-lg">
                    <p className="flex-grow text-xs text-muted-foreground">Pesos de trabajo por bloque</p>
                    {(['kg', 'lb'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCurrentWeightType(type)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${currentWeightType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {INTENSITIES.map(({ pct, label }) => (
                    <div
                      key={pct}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted"
                    >
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="font-mono text-sm font-medium text-foreground">
                        {calcWorkingWeight(estimated, pct, currentWeightType)} {currentWeightType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
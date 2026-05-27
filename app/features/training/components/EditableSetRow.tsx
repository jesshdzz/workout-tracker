import { useState } from 'react'
import { Trophy, X, ChevronDown, ChevronUp } from 'lucide-react'
import { workoutService } from '~/services/workout.service'
import type { ActiveSet } from '../store/session.store'

type Props = {
  set: ActiveSet
  onUpdate: (updates: Partial<ActiveSet>) => void
  onDelete: () => void
}

const TECHNIQUES = [
  { value: 'normal', label: 'Normal' },
  { value: 'failure', label: 'Al fallo' },
  { value: 'rest_pause', label: 'Rest-pause' },
  { value: 'drop_set', label: 'Drop-set' },
] as const

type Technique = typeof TECHNIQUES[number]['value']

export function EditableSetRow({ set, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estado local para edición
  const [weight, setWeight] = useState(set.weight.toString())
  const [reps, setReps] = useState(set.reps.toString())
  const [rir, setRir] = useState(set.rirPerceived)
  const [technique, setTechnique] = useState<Technique>(set.technique)
  const [setType, setSetType] = useState(set.setType)
  const [weightUnit, setWeightUnit] = useState(set.weightUnit)
  const [rpReps, setRpReps] = useState(set.restPauseReps?.toString() ?? '')
  const [dropWeight, setDropWeight] = useState(set.dropWeight?.toString() ?? '')
  const [dropReps, setDropReps] = useState(set.dropReps?.toString() ?? '')

  const save = async () => {
    setSaving(true)
    const updates: Partial<ActiveSet> = {
      weight: parseFloat(weight) || set.weight,
      reps: parseInt(reps) || set.reps,
      rirPerceived: rir,
      technique,
      setType,
      weightUnit,
      restPauseReps: technique === 'rest_pause' ? parseInt(rpReps) || undefined : undefined,
      dropWeight: technique === 'drop_set' ? parseFloat(dropWeight) || undefined : undefined,
      dropReps: technique === 'drop_set' ? parseInt(dropReps) || undefined : undefined,
    }
    onUpdate(updates)
    await workoutService.updateSet(set.id, updates)
    setSaving(false)
    setExpanded(false)
  }

  const techniqueIndicator: Record<Technique, string | null> = {
    normal: null,
    failure: '● fallo',
    rest_pause: `+ ${set.restPauseReps ?? '?'} rp`,
    drop_set: `↓ ${set.dropWeight ?? '?'}`,
  }

  const indicator = techniqueIndicator[set.technique]

  return (
    <div className={`rounded-xl overflow-hidden border transition-colors ${set.isPR
      ? 'border-primary/30 bg-primary/5'
      : expanded
        ? 'border-border bg-card'
        : 'border-transparent bg-muted'
      }`}>
      {/* Fila compacta — siempre visible */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Número/tipo */}
        <span className={`shrink-0 text-xs font-bold w-5 text-center ${set.setType === 'warmup' ? 'text-muted-foreground' : 'text-foreground'
          }`}>
          {set.setType === 'warmup' ? 'W' : set.setNumber}
        </span>

        {/* Peso × Reps */}
        <span className="flex-1 font-mono text-sm text-foreground">
          {set.weight} {set.weightUnit} × {set.reps}
          {indicator && (
            <span className="ml-1.5 text-xs text-secondary">{indicator}</span>
          )}
        </span>

        {/* RIR */}
        {set.technique !== 'failure' && (
          <span className="text-xs text-muted-foreground shrink-0">
            RIR {set.rirPerceived}
          </span>
        )}

        {/* PR */}
        {set.isPR && <Trophy size={12} className="text-primary shrink-0" />}

        {/* Saving indicator */}
        {saving && (
          <div className="w-3 h-3 border rounded-full border-primary border-t-transparent animate-spin shrink-0" />
        )}

        {/* Expandir / eliminar */}
        <div className="flex items-center gap-1 shrink-0">
          {expanded
            ? <ChevronUp size={14} className="text-muted-foreground" />
            : <ChevronDown size={14} className="text-muted-foreground" />
          }
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex items-center justify-center w-5 h-5 transition-colors rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Panel de edición expandible */}
      {expanded && (
        <div className="px-3 pt-3 pb-3 space-y-3 border-t border-border">

          {/* Tipo de serie + Unidad */}
          <div className="flex gap-2">
            <div className="flex flex-1 overflow-hidden text-xs border rounded-lg border-border">
              {(['warmup', 'effective'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSetType(t)}
                  className={`flex-1 py-1.5 font-medium transition-colors ${setType === t
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground'
                    }`}
                >
                  {t === 'warmup' ? 'Calent.' : 'Efectiva'}
                </button>
              ))}
            </div>
            <div className="flex overflow-hidden text-xs border rounded-lg border-border">
              {(['kg', 'lb'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setWeightUnit(u)}
                  className={`px-3 py-1.5 font-medium transition-colors ${weightUnit === u
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground'
                    }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Técnica */}
          <div className="flex gap-1.5 flex-wrap">
            {TECHNIQUES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTechnique(t.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${technique === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Peso y Reps */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1 text-xs text-muted-foreground">
                Peso ({weightUnit})
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm text-center border rounded-lg bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-muted-foreground">Reps</label>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm text-center border rounded-lg bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Rest-pause */}
          {technique === 'rest_pause' && (
            <div>
              <label className="block mb-1 text-xs text-muted-foreground">
                Reps extra (rest-pause)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={rpReps}
                onChange={(e) => setRpReps(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm text-center border rounded-lg bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Drop-set */}
          {technique === 'drop_set' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-xs text-muted-foreground">
                  Peso drop ({weightUnit})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={dropWeight}
                  onChange={(e) => setDropWeight(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm text-center border rounded-lg bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-muted-foreground">
                  Reps drop
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={dropReps}
                  onChange={(e) => setDropReps(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm text-center border rounded-lg bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* RIR */}
          {technique !== 'failure' && (
            <div>
              <label className="block mb-1 text-xs text-muted-foreground">
                RIR percibido
              </label>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRir(r)}
                    className={`flex-1 h-8 text-xs font-medium rounded-lg transition-colors ${rir === r
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border'
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="flex-1 py-2 text-sm transition-colors rounded-lg text-muted-foreground bg-muted hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 text-sm font-medium transition-colors rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
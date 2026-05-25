import { useState } from 'react'
import { Trophy, Check, Pencil } from 'lucide-react'
import { workoutService } from '~/services/workout.service'
import type { ActiveSet } from '../store/session.store'

type Props = {
  set: ActiveSet
  onUpdate: (updates: Partial<ActiveSet>) => void
}

type EditableField = 'weight' | 'reps' | 'restPauseReps' | 'dropWeight' | 'dropReps'

export function EditableSetRow({ set, onUpdate }: Props) {
  const [editing, setEditing] = useState<EditableField | null>(null)
  const [tempValue, setTempValue] = useState('')
  const [saving, setSaving] = useState(false)

  const startEdit = (field: EditableField, currentValue: number | undefined) => {
    setEditing(field)
    setTempValue(currentValue?.toString() ?? '')
  }

  const commitEdit = async () => {
    if (!editing || !tempValue) { setEditing(null); return }

    const numValue = parseFloat(tempValue)
    if (isNaN(numValue)) { setEditing(null); return }

    setSaving(true)

    const update: Partial<ActiveSet> = { [editing]: numValue }
    onUpdate(update)

    await workoutService.updateSet(set.id, {
      weight:        editing === 'weight'        ? numValue : undefined,
      reps:          editing === 'reps'          ? numValue : undefined,
      restPauseReps: editing === 'restPauseReps' ? numValue : undefined,
      dropWeight:    editing === 'dropWeight'    ? numValue : undefined,
      dropReps:      editing === 'dropReps'      ? numValue : undefined,
    })

    setSaving(false)
    setEditing(null)
  }

  const techniqueLabel = {
    normal:     null,
    failure:    'Al fallo',
    rest_pause: 'Rest-pause',
    drop_set:   'Drop-set',
  }[set.technique]

  const EditableValue = ({
    field, value, suffix = ''
  }: { field: EditableField; value: number | undefined; suffix?: string }) => {
    if (editing === field) {
      return (
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit() }}
          className="w-16 font-mono text-sm text-center bg-transparent border-b border-primary text-foreground focus:outline-none"
        />
      )
    }

    return (
      <button
        type="button"
        onClick={() => startEdit(field, value)}
        className="font-mono text-sm transition-colors text-foreground hover:text-primary underline-offset-2 hover:underline"
      >
        {value ?? '—'}{suffix}
      </button>
    )
  }

  return (
    <div className={`rounded-lg px-3 py-2.5 ${
      set.isPR
        ? 'bg-primary/10 border border-primary/20'
        : set.setType === 'warmup'
        ? 'bg-muted border border-transparent'
        : 'bg-card border border-border'
    }`}>
      {/* Fila principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
            set.setType === 'warmup'
              ? 'bg-muted-foreground/10 text-muted-foreground'
              : 'bg-primary/10 text-primary'
          }`}>
            {set.setType === 'warmup' ? 'W' : set.setNumber}
          </span>
          {techniqueLabel && (
            <span className="text-xs font-medium text-secondary">{techniqueLabel}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <EditableValue field="weight" value={set.weight} />
          <span className="text-xs text-muted-foreground">{set.weightUnit}</span>
          <span className="text-muted-foreground">×</span>
          <EditableValue field="reps" value={set.reps} />
          <span className="text-xs text-muted-foreground">reps</span>
        </div>

        <div className="flex items-center gap-1.5">
          {set.technique !== 'failure' && (
            <span className="text-xs text-muted-foreground">RIR {set.rirPerceived}</span>
          )}
          {set.isPR && <Trophy size={12} className="text-primary" />}
          {saving && <div className="w-3 h-3 border rounded-full border-primary border-t-transparent animate-spin" />}
        </div>
      </div>

      {/* Rest-pause extra */}
      {set.technique === 'rest_pause' && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground pl-6">
          <span>+ pausa →</span>
          <EditableValue field="restPauseReps" value={set.restPauseReps} suffix=" reps" />
        </div>
      )}

      {/* Drop-set extra */}
      {set.technique === 'drop_set' && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground pl-6">
          <span>drop →</span>
          <EditableValue field="dropWeight" value={set.dropWeight} />
          <span>{set.weightUnit} ×</span>
          <EditableValue field="dropReps" value={set.dropReps} suffix=" reps" />
        </div>
      )}
    </div>
  )
}
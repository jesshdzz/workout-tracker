import { useEffect, useRef, useState } from 'react'
import { calcRM, calcWorkingWeight } from '~/core/utils/epley'
import { formatDateShort } from '~/core/utils/formatters'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { exercisesRepository } from '~/repositories/exercises.repository'
import type { Database } from '~/core/types/database.types'
import type { RMEntry } from '../hooks/useProfile'

type Exercise = Database['public']['Tables']['exercises']['Row']

type Props = {
  rms: RMEntry[]
  onSaveRM: (exerciseId: string, rmKg: number) => Promise<void>
}

export function RMSettings({ rms, onSaveRM }: Props) {
  // — Calculadora —
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [currentWeightType, setCurrentWeightType] = useState<'kg' | 'lb'>('kg')
  const [showCalc, setShowCalc] = useState(false)

  // — Registrar RM —
  const [showRegister, setShowRegister] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [rmKg, setRmKg] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Cargar ejercicios una sola vez al montar
  useEffect(() => {
    exercisesRepository.findAll().then((result) => {
      if (result.data) setExercises(result.data)
    })
  }, [])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search.trim().length > 0
    ? exercises.filter((ex) => {
        const term = search.toLowerCase()
        return (
          (ex.name_es ?? ex.name).toLowerCase().includes(term) ||
          ex.name.toLowerCase().includes(term)
        )
      }).slice(0, 8)
    : []

  const estimated = weight && reps
    ? calcRM(parseFloat(weight), parseInt(reps))
    : null

  const INTENSITIES = [
    { pct: 0.65, label: 'Bloque 1 (65%)' },
    { pct: 0.78, label: 'Bloque 2 (78%)' },
    { pct: 0.88, label: 'Bloque 3 (88%)' },
  ]

  const handleSelectExercise = (ex: Exercise) => {
    setSelectedExercise(ex)
    setSearch(ex.name_es ?? ex.name)
    setShowDropdown(false)
    setSaveError(null)
    setSaveSuccess(false)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setSelectedExercise(null)
    setSaveSuccess(false)
    setShowDropdown(value.trim().length > 0)
  }

  const handleSave = async () => {
    if (!selectedExercise) {
      setSaveError('Selecciona un ejercicio de la lista.')
      return
    }
    const kg = parseFloat(rmKg)
    if (isNaN(kg) || kg <= 0) {
      setSaveError('Introduce un valor de kg válido.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSaveRM(selectedExercise.id, kg)
      setSaveSuccess(true)
      setSearch('')
      setSelectedExercise(null)
      setRmKg('')
    } catch {
      setSaveError('Error al guardar el RM. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

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

      {/* Registrar RM manual */}
      <div className="overflow-hidden border rounded-2xl bg-card border-border">
        <button
          type="button"
          onClick={() => setShowRegister(!showRegister)}
          className="flex items-center justify-between w-full px-4 py-3"
        >
          <p className="text-sm font-medium text-foreground">Registrar RM manualmente</p>
          {showRegister
            ? <ChevronUp size={16} className="text-muted-foreground" />
            : <ChevronDown size={16} className="text-muted-foreground" />
          }
        </button>

        {showRegister && (
          <div className="px-4 pt-3 pb-4 space-y-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Introduce tu RM real para un ejercicio. Sobrescribirá el valor actual si ya existe.
            </p>

            {/* Buscador de ejercicio */}
            <div className="space-y-1" ref={searchRef}>
              <label className="text-xs text-muted-foreground">Ejercicio</label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute -translate-y-1/2 left-3 top-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Busca un ejercicio…"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => search.trim().length > 0 && setShowDropdown(true)}
                  className="w-full py-2 pl-8 pr-3 text-sm border rounded-xl bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {showDropdown && filtered.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 overflow-y-auto border shadow-lg max-h-48 rounded-xl bg-card border-border">
                    {filtered.map((ex) => (
                      <li key={ex.id}>
                        <button
                          type="button"
                          onMouseDown={() => handleSelectExercise(ex)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-muted text-foreground"
                        >
                          {ex.name_es ?? ex.name}
                          {ex.name_es && (
                            <span className="ml-1 text-xs text-muted-foreground">({ex.name})</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {showDropdown && search.trim().length > 0 && filtered.length === 0 && (
                  <div className="absolute z-10 w-full px-3 py-2 mt-1 text-sm border rounded-xl bg-card border-border text-muted-foreground">
                    Sin resultados
                  </div>
                )}
              </div>
            </div>

            {/* Input kg */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">RM (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="100"
                value={rmKg}
                onChange={(e) => { setRmKg(e.target.value); setSaveSuccess(false) }}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Feedback */}
            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-xs text-primary">RM guardado correctamente.</p>
            )}

            <Button
              variant="default"
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar RM'}
            </Button>
          </div>
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
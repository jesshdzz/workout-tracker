// app/services/ai-trainer.service.ts
//
// Motor IA de Entrenamiento Personalizado — Heavy Duty Híbrido
// Lógica completamente determinista basada en docs/plan_entrenamiento.md
// Sin dependencias externas ni llamadas a LLM.

import { calcRM, calcWorkingWeight, kgToLb } from '~/core/utils/epley'
import { BLOCK_PRESCRIPTIONS, type DeficiencyReport } from '~/repositories/ai-program-states.repository'
import {
  calculateRecoveryScore,
  resolveMotorAction,
  resolveVolumeMultiplier,
  type MotorAction,
} from '~/repositories/daily-checkins.repository'
import type { Database } from '~/core/types/database.types'

type AIProgramState = Database['public']['Tables']['ai_program_states']['Row']
type UserMetrics    = Database['public']['Tables']['user_metrics']['Row']
type DailyCheckin   = Database['public']['Tables']['daily_checkins']['Row']
type PostFeedback   = Database['public']['Tables']['post_session_feedback']['Row']

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type WeightUnit = 'kg' | 'lb'

/** Resultado de calcular el siguiente peso para un ejercicio */
export type WeightDecision = {
  newWeight: number
  displayWeight: string          // "22.5 kg" o "50 lb"
  action: 'increase' | 'maintain' | 'decrease'
  reason: WeightProgressionReason
}

export type WeightProgressionReason =
  | 'completed_range_with_rir_buffer'  // Subió peso correctamente
  | 'increment_too_small_add_rep'      // El incremento matemático < 1% → sumar rep
  | 'range_not_completed'              // No completó el rango mínimo
  | 'deload_week'                      // Semana de deload, mantener
  | 'no_rm_available'                  // Sin RM registrado

/** Series de aproximación calculadas automáticamente */
export type WarmupSet = {
  setNumber: number
  intensityPct: number       // % del peso de trabajo (no del RM)
  reps: number
  weightKg: number
  weightLb: number
  displayWeight: string
}

/** Prescripción completa de un ejercicio para la sesión del día */
export type ExercisePrescription = {
  exerciseId: string
  exerciseName: string
  isCompound: boolean
  warmupSets: WarmupSet[]
  targetSets: number
  targetRepsMin: number
  targetRepsMax: number
  suggestedWeightKg: number
  suggestedWeightLb: number
  displayWeight: string
  targetRIRMin: number
  targetRIRMax: number
  allowRestPause: boolean
  allowDropset: boolean
  prioritized: boolean       // true = músculo débil/prioridad del usuario
  note: string | null        // Ej: "No ir al fallo — RIR 0-1 máximo" (para RDL)
}

/** Prescripción de cardio LISS */
export type CardioPrescription = {
  type: 'LISS'
  duration_min: number
  speed_kmh: number
  incline_pct: number
  rationale: string
}

/** Prescripción completa de la sesión del día */
export type SessionPrescription = {
  week: number
  block: string
  blockLabel: string
  motorAction: MotorAction
  motorMessage: string | null
  recoveryScore: number
  exercises: ExercisePrescription[]
  cardioPostSession: CardioPrescription | null
  isDeload: boolean
  isRMTestWeek: boolean
}

// Etiquetas amigables para los bloques
const BLOCK_LABELS: Record<string, string> = {
  rm_testing:       'Semana 0 — Test de RMs',
  accumulation:     'Bloque 1 — Acumulación',
  intensification:  'Bloque 2 — Intensificación',
  realization:      'Bloque 3 — Realización',
  deload:           'Semana de Deload',
  transition:       'Bloque 4 — Transición',
}

// ─────────────────────────────────────────────────────────────────────────────
// A. Cálculo de progresión de peso con validación kg/lb
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula si el usuario debe subir peso la próxima sesión y cuánto.
 *
 * Regla de oro (plan_entrenamiento.md §7):
 *   Si completas todas las reps del rango con RIR ≥ 2 → sube 2.5% la siguiente semana.
 *   Redondea al incremento físico más cercano disponible en el gimnasio.
 *   Si el incremento redondeado < 1% del peso actual → sumar rep en lugar de subir disco.
 */
export function calculateNextWeight(
  currentWeight: number,
  unit: WeightUnit,
  performanceData: {
    completedReps: number
    targetRepsMax: number
    rirAchieved: number
    isDeload: boolean
  }
): WeightDecision {
  const { completedReps, targetRepsMax, rirAchieved, isDeload } = performanceData

  if (isDeload) {
    return makeDecision(currentWeight, unit, 'maintain', 'deload_week')
  }

  // Regla de oro: completó todo el rango con RIR ≥ 2 → subir peso
  if (completedReps >= targetRepsMax && rirAchieved >= 2) {
    const rawIncrease = currentWeight * 0.025

    // Incremento mínimo físico disponible según unidad
    // kg: discos de 1.25 kg → mínimo salto = 2.5 kg (par de discos)
    // lb: discos de 2.5 lb → mínimo salto = 5 lb (par de discos)
    const minStep = unit === 'kg' ? 2.5 : 5
    const halfStep = unit === 'kg' ? 1.25 : 2.5

    let roundedIncrease = Math.round(rawIncrease / halfStep) * halfStep
    if (roundedIncrease < halfStep) roundedIncrease = halfStep

    // Si el incremento físico mínimo representa < 1% del peso → prescribir +1 rep
    if (roundedIncrease / currentWeight < 0.01) {
      return makeDecision(currentWeight, unit, 'maintain', 'increment_too_small_add_rep')
    }

    // Asegurar que subimos al menos el mínimo físico (par de discos)
    const finalIncrease = Math.max(roundedIncrease, minStep)
    return makeDecision(currentWeight + finalIncrease, unit, 'increase', 'completed_range_with_rir_buffer')
  }

  return makeDecision(currentWeight, unit, 'maintain', 'range_not_completed')
}

function makeDecision(
  weight: number,
  unit: WeightUnit,
  action: WeightDecision['action'],
  reason: WeightProgressionReason
): WeightDecision {
  const kg = unit === 'kg' ? weight : weight / 2.2046
  const lb = unit === 'lb' ? weight : weight * 2.2046
  return {
    newWeight: weight,
    displayWeight: unit === 'kg'
      ? `${roundToStep(kg, 1.25)} kg`
      : `${roundToStep(lb, 2.5)} lb`,
    action,
    reason,
  }
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Series de aproximación automáticas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera las series de aproximación según el bloque actual.
 * (plan_entrenamiento.md §4 — Series de aproximación por ejercicio)
 *
 * Bloque 1-2: 2 aproximaciones (40% + 65%)
 * Bloque 3:   3 aproximaciones (50% + 70% + 85-90%)
 */
export function generateWarmupSets(
  workingWeightKg: number,
  unit: WeightUnit,
  numWarmups: 2 | 3
): WarmupSet[] {
  const protocols2: { pct: number; reps: number }[] = [
    { pct: 0.40, reps: 8 },
    { pct: 0.65, reps: 5 },
  ]
  const protocols3: { pct: number; reps: number }[] = [
    { pct: 0.50, reps: 6 },
    { pct: 0.70, reps: 4 },
    { pct: 0.88, reps: 2 },
  ]
  const protocols = numWarmups === 3 ? protocols3 : protocols2

  return protocols.map((p, i) => {
    const kg = roundToStep(workingWeightKg * p.pct, 1.25)
    const lb = roundToStep(kgToLb(kg), 2.5)
    return {
      setNumber: i + 1,
      intensityPct: p.pct,
      reps: p.reps,
      weightKg: kg,
      weightLb: lb,
      displayWeight: unit === 'kg' ? `${kg} kg` : `${lb} lb`,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Modificador diario (check-in → ajuste de sesión)
// ─────────────────────────────────────────────────────────────────────────────

export type CheckinInput = {
  sleep_hours: number
  stress_level: number
  muscle_soreness: number
}

export function applyDailyModifier(
  exercises: ExercisePrescription[],
  checkin: CheckinInput
): { exercises: ExercisePrescription[]; action: MotorAction; message: string | null; score: number } {
  const score = calculateRecoveryScore({
    sleep_hours: checkin.sleep_hours,
    stress_level: checkin.stress_level,
    muscle_soreness: checkin.muscle_soreness,
  })
  const action = resolveMotorAction(score)

  let modified = exercises
  let message: string | null = null

  switch (action) {
    case 'technique_focus':
      // Mitad de series, sin técnicas avanzadas
      modified = exercises.map(ex => ({
        ...ex,
        targetSets: Math.max(1, Math.ceil(ex.targetSets / 2)),
        allowRestPause: false,
        allowDropset: false,
      }))
      message = `Recuperación baja (score ${score}/100). Sesión de técnica: series reducidas a la mitad, sin técnicas avanzadas.`
      break

    case 'reduced_volume':
      // −1 serie en compuestos, sin RP/DS
      modified = exercises.map(ex => ({
        ...ex,
        targetSets: ex.isCompound ? Math.max(1, ex.targetSets - 1) : ex.targetSets,
        allowRestPause: false,
        allowDropset: false,
      }))
      message = `Recuperación moderada (score ${score}/100). Sesión reducida: −1 serie en compuestos, sin técnicas avanzadas.`
      break

    case 'skip_advanced_techniques':
      // Volumen completo pero sin RP/DS
      modified = exercises.map(ex => ({
        ...ex,
        allowRestPause: false,
        allowDropset: false,
      }))
      message = `Recuperación aceptable (score ${score}/100). Sin técnicas avanzadas hoy.`
      break

    case 'normal':
      message = null
      break
  }

  return { exercises: modified, action, message, score }
}

// ─────────────────────────────────────────────────────────────────────────────
// D. Prescripción de cardio LISS post-entreno
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determina si corresponde cardio y con qué parámetros.
 * Protocolo base (plan_entrenamiento.md §3): 20 min @ 4 km/h @ 20° inclinación.
 * Se ajusta duración según % grasa y metas.
 */
export function prescribeCardio(
  goals: Record<string, unknown>,
  bodyFatPct: number | null,
  isRestDay: boolean
): CardioPrescription | null {
  const wantsLoseFat   = goals?.lose_fat === true
  const wantsMaintainBF = goals?.maintain_bf_range === true

  if (!wantsLoseFat && !wantsMaintainBF) return null
  if (isRestDay) return null   // El Día 3 ya tiene su protocolo propio

  const baseDuration = 20
  const baseSpeed    = 4.0
  const baseIncline  = 20

  // Ajuste: más grasa → más minutos (máx 35 min para no comprometer recuperación)
  let durationAdjust = 0
  if (bodyFatPct !== null) {
    if (bodyFatPct > 20) durationAdjust = 10
    else if (bodyFatPct > 15) durationAdjust = 5
  }

  return {
    type: 'LISS',
    duration_min: Math.min(baseDuration + durationAdjust, 35),
    speed_kmh: baseSpeed,
    incline_pct: baseIncline,
    rationale: `Zona 2 cardíaca — oxidación de grasa sin comprometer recuperación muscular. Cinta a ${baseSpeed} km/h · ${baseIncline}° inclinación.`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E. Detección semanal automática de deficiencias
// ─────────────────────────────────────────────────────────────────────────────

export type ExerciseProgressRecord = {
  exerciseId: string
  muscleId: string
  isCompound: boolean
  sessions: Array<{
    week: number
    weightKg: number
    repsCompleted: number
    rirAchieved: number
  }>
}

export type WeeklyAnalysisResult = {
  deficiencies: DeficiencyReport[]
  alerts: string[]                    // Alertas en lenguaje natural para el Dashboard
  corrections: string[]               // Correcciones automáticas aplicadas
  avgSleepThisWeek: number
  recoveryFactor: 'low' | 'moderate' | 'good'
}

/**
 * Analiza el progreso semanal de todos los grupos musculares.
 * Corre al inicio de la primera sesión de cada semana (silencioso).
 *
 * 3 diagnósticos en cascada (por probabilidad):
 * 1. Cuello de botella en sinergista (compuesto estancado, aislamiento progresa)
 * 2. Problema de recuperación (ambos estancados → evaluar sueño)
 * 3. Meseta de adaptación (sin progreso en nada por 3+ semanas)
 */
export function runWeeklyDeficiencyAnalysis(
  progressHistory: ExerciseProgressRecord[],
  recentCheckins: DailyCheckin[],
  currentWeek: number,
  muscleGroups: Record<string, { synergists: string[] }>
): WeeklyAnalysisResult {
  const deficiencies: DeficiencyReport[] = []
  const alerts: string[] = []
  const corrections: string[] = []

  // Calcular promedio de sueño de la semana
  const sleepValues = recentCheckins
    .filter(c => c.sleep_hours !== null)
    .map(c => c.sleep_hours as number)
  const avgSleep = sleepValues.length > 0
    ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
    : 7
  const recoveryFactor: 'low' | 'moderate' | 'good' =
    avgSleep < 6 ? 'low' : avgSleep < 7 ? 'moderate' : 'good'

  // Agrupar por grupo muscular
  const byMuscle: Record<string, { compound: ExerciseProgressRecord[]; isolation: ExerciseProgressRecord[] }> = {}
  for (const record of progressHistory) {
    if (!byMuscle[record.muscleId]) {
      byMuscle[record.muscleId] = { compound: [], isolation: [] }
    }
    if (record.isCompound) {
      byMuscle[record.muscleId].compound.push(record)
    } else {
      byMuscle[record.muscleId].isolation.push(record)
    }
  }

  for (const [muscle, { compound, isolation }] of Object.entries(byMuscle)) {
    if (compound.length === 0) continue

    const compoundStalled = areAllStalled(compound, 3)
    const isolationStalled = isolation.length > 0 && areAllStalled(isolation, 3)
    const isolationProgressing = isolation.length > 0 && !isolationStalled

    if (compoundStalled && isolationProgressing) {
      // Diagnóstico 1: el músculo objetivo progresa (aislamiento ↑) pero el compuesto no
      // → el cuello de botella está en un sinergista, no en el músculo objetivo
      const synergists = muscleGroups[muscle]?.synergists ?? []
      deficiencies.push({
        primaryMuscle: muscle,
        type: 'synergist_bottleneck',
        suspectedWeak: synergists,
        action: 'add_priority_work_for_synergists',
        detectedWeek: currentWeek,
        avg_sleep_this_week: avgSleep,
        recovery_factor: recoveryFactor,
      })
      if (synergists.length > 0) {
        alerts.push(
          `Tu ${formatMuscle(muscle)} está estancado en ejercicios compuestos, pero progresa en aislamiento. ` +
          `Posible punto débil: ${synergists.map(formatMuscle).join(', ')}.`
        )
        corrections.push(`Añadir trabajo prioritario para ${synergists.map(formatMuscle).join(', ')} la próxima semana.`)
      }
    } else if (compoundStalled && isolationStalled) {
      // Diagnóstico 2: ambos estancados → problema sistémico (recuperación o nutrición)
      deficiencies.push({
        primaryMuscle: muscle,
        type: 'recovery_or_volume_issue',
        action: recoveryFactor === 'low'
          ? 'improve_sleep_and_nutrition'
          : 'consider_early_deload',
        detectedWeek: currentWeek,
        avg_sleep_this_week: avgSleep,
        recovery_factor: recoveryFactor,
      })
      if (recoveryFactor === 'low') {
        alerts.push(
          `Tu ${formatMuscle(muscle)} lleva ${currentWeek > 2 ? '3+' : '2'} semanas sin progresar. ` +
          `Tu sueño promedio esta semana fue ${avgSleep.toFixed(1)}h — prioriza el descanso.`
        )
      } else {
        alerts.push(
          `Tu ${formatMuscle(muscle)} lleva varias semanas sin progresar. ` +
          `Considera revisar tu ingesta calórica y de proteína.`
        )
      }
    }
  }

  // Diagnóstico 3: meseta global (ningún músculo progresa en 3+ semanas)
  const totalStalled = Object.values(byMuscle).filter(g => areAllStalled(g.compound, 3)).length
  const totalGroups = Object.keys(byMuscle).length
  if (totalGroups > 0 && totalStalled / totalGroups > 0.6) {
    alerts.push(
      `Más del 60% de tus grupos musculares están estancados. ` +
      `Esto suele indicar un problema de recuperación sistémica o nutrición. ` +
      `Considera adelantar el deload esta semana.`
    )
    corrections.push('Evaluar deload preventivo anticipado.')
  }

  return { deficiencies, alerts, corrections, avgSleepThisWeek: avgSleep, recoveryFactor }
}

// Determina si un grupo de ejercicios está estancado
function areAllStalled(records: ExerciseProgressRecord[], minSessions: number): boolean {
  if (records.length === 0) return false
  return records.every(record => isExerciseStalled(record, minSessions))
}

function isExerciseStalled(record: ExerciseProgressRecord, minSessions: number): boolean {
  const sessions = record.sessions.slice(0, minSessions)
  if (sessions.length < minSessions) return false

  // Sin progreso = el peso no subió en las últimas N sesiones
  const weights = sessions.map(s => s.weightKg)
  const maxWeight = Math.max(...weights)
  const firstWeight = weights[weights.length - 1]
  return maxWeight <= firstWeight
}

function formatMuscle(id: string): string {
  const names: Record<string, string> = {
    biceps: 'bíceps', triceps: 'tríceps', forearms: 'antebrazos',
    rear_deltoid: 'deltoides posterior', lateral_deltoid: 'deltoides lateral',
    front_deltoid: 'deltoides anterior', upper_chest: 'pectoral superior',
    lower_chest: 'pectoral inferior', lats: 'dorsales', traps: 'trapecios',
    calves: 'pantorrillas', quads: 'cuádriceps', hamstrings: 'isquiosurales',
    glutes: 'glúteos', abs: 'abdominales',
  }
  return names[id] ?? id
}

// ─────────────────────────────────────────────────────────────────────────────
// F. Análisis de feedback post-sesión (para ajuste del bloque)
// ─────────────────────────────────────────────────────────────────────────────

export type FeedbackAnalysis = {
  shouldTriggerEarlyDeload: boolean
  shouldIncreaseIntensity: boolean
  excessiveFatigueCount: number
  recommendation: string | null
}

/**
 * Analiza el historial de feedback post-sesión para detectar patrones.
 * Si "too_much" ≥ 2 sesiones seguidas → deload preventivo.
 * Si "too_easy" ≥ 2 sesiones seguidas → proponer aumento de intensidad.
 */
export function analyzeFeedbackPattern(
  feedbackHistory: PostFeedback[]
): FeedbackAnalysis {
  if (feedbackHistory.length === 0) {
    return { shouldTriggerEarlyDeload: false, shouldIncreaseIntensity: false, excessiveFatigueCount: 0, recommendation: null }
  }

  // Contar sesiones consecutivas "too_much"
  let tooMuchStreak = 0
  let tooEasyStreak = 0
  let excessiveFatigueCount = 0

  for (const fb of feedbackHistory) {
    if (fb.perceived_difficulty === 'too_much') tooMuchStreak++
    else break
  }
  for (const fb of feedbackHistory) {
    if (fb.excessive_fatigue_flag) excessiveFatigueCount++
    else break
  }
  for (const fb of feedbackHistory) {
    if (fb.perceived_difficulty === 'too_easy') tooEasyStreak++
    else break
  }

  const shouldTriggerEarlyDeload = tooMuchStreak >= 2 || excessiveFatigueCount >= 2
  const shouldIncreaseIntensity = tooEasyStreak >= 2

  let recommendation: string | null = null
  if (shouldTriggerEarlyDeload) {
    recommendation = `Llevas ${tooMuchStreak} sesiones seguidas reportando carga excesiva. El motor recomienda adelantar el deload esta semana.`
  } else if (shouldIncreaseIntensity) {
    recommendation = `Las últimas ${tooEasyStreak} sesiones han sido demasiado fáciles. Puedes subir la intensidad ligeramente.`
  }

  return { shouldTriggerEarlyDeload, shouldIncreaseIntensity, excessiveFatigueCount, recommendation }
}

// ─────────────────────────────────────────────────────────────────────────────
// G. Prescripción de sesión completa (punto de entrada principal)
// ─────────────────────────────────────────────────────────────────────────────

export type ExerciseInput = {
  exerciseId: string
  exerciseName: string
  isCompound: boolean
  rmKg: number | null
  hasRestPause: boolean
  hasDropset: boolean
  isPrioritized: boolean        // Está en weak_muscles o priority_muscles del usuario
  safetyNote?: string           // Ej: "No al fallo total — RDL"
}

/**
 * Genera la prescripción completa de todos los ejercicios para la sesión del día.
 * Combina: bloque actual + RM + check-in + métricas del usuario.
 */
export function generateSessionPrescription(
  programState: AIProgramState,
  exercises: ExerciseInput[],
  userMetrics: UserMetrics,
  checkin: CheckinInput | null
): SessionPrescription {
  const week = programState.current_week ?? 1
  const block = programState.current_block ?? 'accumulation'
  const isDeload = block === 'deload'
  const isRMTestWeek = block === 'rm_testing'
  const unit = (userMetrics.weight_unit as WeightUnit) ?? 'kg'

  // Parámetros del bloque desde la tabla maestra
  const blockPrescription = BLOCK_PRESCRIPTIONS[week] ?? BLOCK_PRESCRIPTIONS[1]
  const intensityPct        = blockPrescription.block_intensity_pct ?? 0.65
  const targetSetsCompound  = blockPrescription.block_target_sets ?? 2
  const targetSetsAccessory = isDeload ? 1 : Math.max(1, targetSetsCompound - 1)
  const repMin  = blockPrescription.block_rep_min ?? 10
  const repMax  = blockPrescription.block_rep_max ?? 15
  const rirMin  = blockPrescription.block_rir_min ?? 2
  const rirMax  = blockPrescription.block_rir_max ?? 3
  const allowTech = blockPrescription.block_allow_techniques ?? false

  // Número de aproximaciones: Bloque 3 (semanas 9-12) usa 3, el resto usa 2
  const numWarmups: 2 | 3 = (week >= 9 && week <= 12) ? 3 : 2

  // Construir prescripción base de cada ejercicio
  const baseExercises: ExercisePrescription[] = exercises.map(ex => {
    const workingKg = ex.rmKg
      ? calcWorkingWeight(ex.rmKg, intensityPct, 'kg')
      : 0
    const workingLb = kgToLb(workingKg)

    const displayWeight = ex.rmKg
      ? (unit === 'kg' ? `${workingKg} kg` : `${roundToStep(workingLb, 2.5)} lb`)
      : 'Sin RM — registra tu RM primero'

    const sets = ex.isCompound ? targetSetsCompound : targetSetsAccessory

    return {
      exerciseId:      ex.exerciseId,
      exerciseName:    ex.exerciseName,
      isCompound:      ex.isCompound,
      warmupSets:      ex.rmKg && sets > 0
        ? generateWarmupSets(workingKg, unit, numWarmups)
        : [],
      targetSets:      sets,
      targetRepsMin:   repMin,
      targetRepsMax:   repMax,
      suggestedWeightKg: workingKg,
      suggestedWeightLb: roundToStep(workingLb, 2.5),
      displayWeight,
      targetRIRMin:    rirMin,
      targetRIRMax:    rirMax,
      allowRestPause:  allowTech && ex.hasRestPause,
      allowDropset:    allowTech && ex.hasDropset,
      prioritized:     ex.isPrioritized,
      note:            ex.safetyNote ?? null,
    }
  })

  // Aplicar modificador del check-in diario
  const goals = (userMetrics.goals as Record<string, unknown>) ?? {}
  const bodyFatPct = userMetrics.body_fat_pct

  if (!checkin) {
    return {
      week,
      block,
      blockLabel: BLOCK_LABELS[block] ?? block,
      motorAction: 'normal',
      motorMessage: null,
      recoveryScore: 100,
      exercises: baseExercises,
      cardioPostSession: prescribeCardio(goals, bodyFatPct, false),
      isDeload,
      isRMTestWeek,
    }
  }

  const { exercises: modifiedExercises, action, message, score } =
    applyDailyModifier(baseExercises, checkin)

  return {
    week,
    block,
    blockLabel: BLOCK_LABELS[block] ?? block,
    motorAction: action,
    motorMessage: message,
    recoveryScore: score,
    exercises: modifiedExercises,
    cardioPostSession: prescribeCardio(goals, bodyFatPct, false),
    isDeload,
    isRMTestWeek,
  }
}

// Export de utilidades auxiliares para tests/hooks
export { calculateRecoveryScore, resolveMotorAction, resolveVolumeMultiplier }

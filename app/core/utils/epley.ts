// Calcula el 1RM estimado dado un peso y repeticiones
export const calcRM = (weight: number, reps: number): number => {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

// Calcula el peso de trabajo dado un RM y un porcentaje de intensidad
// Redondea al 2.5kg más cercano para que sea un peso real en el gym
export const calcWorkingWeight = (rm: number, intensityPct: number): number => {
  return Math.round((rm * intensityPct) / 2.5) * 2.5
}

// Convierte kg a lb y viceversa
export const kgToLb = (kg: number): number => Math.round(kg * 2.2046 * 4) / 4
export const lbToKg = (lb: number): number => Math.round((lb / 2.2046) * 4) / 4
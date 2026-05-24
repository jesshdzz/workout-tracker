import type { PostgrestError, AuthError } from '@supabase/supabase-js'

export type AppError = PostgrestError | AuthError

export type Result<T, E = AppError> =
  | { data: T; error: null }
  | { data: null; error: E }

export type WeightUnit = 'kg' | 'lb'
export type SetType = 'warmup' | 'effective'
export type RecordType = 'estimated_1rm' | 'weight' | 'reps'
export type MuscleRole = 'primary' | 'secondary'
export type BodyRegion = 'upper_push' | 'upper_pull' | 'core' | 'lower' | 'full_body'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Result } from '~/core/types/common.types'

export class BaseRepository {
  protected handle<T>(data: T | null, error: PostgrestError | null): Result<T> {
    if (error || data === null) return { data: null, error: error! }
    return { data, error: null }
  }
}
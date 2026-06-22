import type { PostgrestError } from '@supabase/supabase-js'

export function logSupabaseError(label: string, error: PostgrestError | null | undefined): void {
  if (!error) return
  console.error(`[nurture] ${label}`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  })
}

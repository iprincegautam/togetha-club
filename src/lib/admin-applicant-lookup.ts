import type { SupabaseClient } from '@supabase/supabase-js'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Strip accidental template braces from copy-pasted admin URLs. */
export function normalizeApplicantIdOrEmail(raw: string): string {
  return decodeURIComponent(raw)
    .trim()
    .replace(/^\{+\/?/, '')
    .replace(/\}+$/, '')
    .trim()
}

export function isApplicantUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export async function findApplicantByIdOrEmail(
  service: SupabaseClient,
  raw: string
): Promise<{ id: string; email: string } | null> {
  const key = normalizeApplicantIdOrEmail(raw)
  if (!key) return null

  const select = 'id, email'

  if (isApplicantUuid(key)) {
    const { data } = await service.from('applicants').select(select).eq('id', key).maybeSingle()
    return data ? { id: data.id, email: data.email } : null
  }

  if (key.includes('@')) {
    const { data } = await service
      .from('applicants')
      .select(select)
      .ilike('email', key.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data ? { id: data.id, email: data.email } : null
  }

  return null
}

export const APPLICANT_SELECT_FOR_BALANCE = `
  id, email, name, status, balance_due, amount_paid, final_amount,
  original_amount, discount_amount, payment_plan, kyc_status,
  date_choice, batch_slug, profile_completed_at, created_at, quiz_answers,
  batches ( name ),
  batch_departures ( label )
`

import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveApplicantDepartureLabel } from '@/lib/admin-applicant-filters'
import { mapApplicantRow, type ApplicantDbRow } from '@/lib/applicants'

export async function fetchAdminApplicants(service: SupabaseClient) {
  const fullSelect = `
    id,
    name,
    email,
    phone,
    gender,
    batch_slug,
    date_choice,
    quiz_score,
    status,
    created_at,
    priority_review,
    lead_source,
    batches ( name, slug ),
    promo_codes ( code )
  `

  const full = await service
    .from('applicants')
    .select(fullSelect)
    .order('created_at', { ascending: false })

  let rows: ApplicantDbRow[] | null = (full.data ?? null) as ApplicantDbRow[] | null
  let fetchError = full.error

  if (fetchError) {
    const fallback = await service
      .from('applicants')
      .select(
        `
        id,
        name,
        email,
        gender,
        batch_slug,
        quiz_score,
        status,
        created_at,
        batches ( name, slug )
      `
      )
      .order('created_at', { ascending: false })
    rows = (fallback.data ?? null) as ApplicantDbRow[] | null
    fetchError = fallback.error
  }

  if (fetchError) throw fetchError

  return (rows ?? []).map((row) => {
    const mapped = mapApplicantRow(row)
    return {
      ...mapped,
      departureLabel: resolveApplicantDepartureLabel(row.date_choice, row.batch_slug),
    }
  })
}

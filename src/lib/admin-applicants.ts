import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveApplicantDepartureLabel } from '@/lib/admin-applicant-filters'
import { mapApplicantRow, type ApplicantDbRow } from '@/lib/applicants'

const APPLICANTS_PAGE_SIZE = 1000

async function fetchAllApplicantRows(
  service: SupabaseClient,
  select: string
): Promise<ApplicantDbRow[]> {
  const rows: ApplicantDbRow[] = []

  for (let from = 0; ; from += APPLICANTS_PAGE_SIZE) {
    const to = from + APPLICANTS_PAGE_SIZE - 1
    const pageResult = await service
      .from('applicants')
      .select(select)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (pageResult.error) throw pageResult.error

    const page = (pageResult.data ?? []) as unknown as ApplicantDbRow[]
    rows.push(...page)
    if (page.length < APPLICANTS_PAGE_SIZE) break
  }

  return rows
}

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

  let rows: ApplicantDbRow[] = []
  let fetchError: Error | null = null

  try {
    rows = await fetchAllApplicantRows(service, fullSelect)
  } catch (err) {
    fetchError = err as Error
  }

  if (fetchError) {
    try {
      rows = await fetchAllApplicantRows(
        service,
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
      fetchError = null
    } catch (err) {
      fetchError = err as Error
    }
  }

  if (fetchError) throw fetchError

  return rows.map((row) => {
    const mapped = mapApplicantRow(row)
    return {
      ...mapped,
      departureLabel: resolveApplicantDepartureLabel(row.date_choice, row.batch_slug),
    }
  })
}

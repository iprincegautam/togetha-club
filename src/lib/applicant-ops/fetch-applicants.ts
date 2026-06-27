import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveApplicantDepartureLabel } from '@/lib/admin-applicant-filters'
import { mapApplicantRow, type ApplicantDbRow } from '@/lib/applicants'
import { applySupportApplicantScope } from '@/lib/support/applicant-scope'
import type { SupportViewScope } from '@/lib/support/permissions'

const APPLICANTS_PAGE_SIZE = 1000

const APPLICANT_SELECT = `
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
  assigned_support_id,
  profile_completed_at,
  kyc_status,
  balance_due,
  batches ( name, slug ),
  promo_codes ( code )
`

async function fetchScopedRows(
  service: SupabaseClient,
  viewScope: SupportViewScope,
  supportProfileId: string
): Promise<ApplicantDbRow[]> {
  const rows: ApplicantDbRow[] = []

  for (let from = 0; ; from += APPLICANTS_PAGE_SIZE) {
    const to = from + APPLICANTS_PAGE_SIZE - 1
    let query = service
      .from('applicants')
      .select(APPLICANT_SELECT)
      .order('created_at', { ascending: false })
      .range(from, to)

    query = applySupportApplicantScope(query, viewScope, supportProfileId)

    const pageResult = await query
    if (pageResult.error) throw pageResult.error

    const page = (pageResult.data ?? []) as unknown as ApplicantDbRow[]
    rows.push(...page)
    if (page.length < APPLICANTS_PAGE_SIZE) break
  }

  return rows
}

export async function fetchSupportApplicants(
  service: SupabaseClient,
  viewScope: SupportViewScope,
  supportProfileId: string
) {
  const rows = await fetchScopedRows(service, viewScope, supportProfileId)

  return rows.map((row) => {
    const mapped = mapApplicantRow(row)
    return {
      ...mapped,
      assignedSupportId: row.assigned_support_id ?? null,
      departureLabel: resolveApplicantDepartureLabel(row.date_choice, row.batch_slug),
      profileCompletedAt: row.profile_completed_at ?? null,
      kycStatus: row.kyc_status ?? null,
      balanceDue: row.balance_due ?? null,
    }
  })
}

export async function getSupportApplicantById(
  service: SupabaseClient,
  applicantId: string,
  viewScope: SupportViewScope,
  supportProfileId: string
) {
  let query = service
    .from('applicants')
    .select(
      `
      *,
      batches ( name, slug ),
      promo_codes ( code )
    `
    )
    .eq('id', applicantId)

  query = applySupportApplicantScope(query, viewScope, supportProfileId)

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { SupportViewScope } from '@/lib/support/permissions'

export function applySupportApplicantScope<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  viewScope: SupportViewScope,
  supportProfileId: string
): T {
  if (viewScope === 'all') return query
  return query.eq('assigned_support_id', supportProfileId)
}

export async function assertApplicantInSupportScope(
  service: SupabaseClient,
  applicantId: string,
  viewScope: SupportViewScope,
  supportProfileId: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (viewScope === 'all') return { ok: true }

  const { data, error } = await service
    .from('applicants')
    .select('id, assigned_support_id')
    .eq('id', applicantId)
    .maybeSingle()

  if (error) {
    return { ok: false, error: error.message, status: 500 }
  }

  if (!data) {
    return { ok: false, error: 'Applicant not found', status: 404 }
  }

  if (data.assigned_support_id !== supportProfileId) {
    return { ok: false, error: 'Applicant not assigned to you', status: 403 }
  }

  return { ok: true }
}

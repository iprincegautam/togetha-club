import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureMemberAccountForApplicant } from '@/lib/member-account'
import type { ApplicantStatus } from '@/types/applicant'

const VALID_STATUSES: ApplicantStatus[] = [
  'pending',
  'approved',
  'rejected',
  'paid',
  'deposit_paid',
]

export type PatchApplicantInput = {
  status?: ApplicantStatus
  adminNotes?: string | null
  assignedSupportId?: string | null
}

export async function patchApplicant(
  service: SupabaseClient,
  applicantId: string,
  input: PatchApplicantInput
) {
  const updates: Record<string, unknown> = {}

  if (input.status !== undefined) {
    if (!VALID_STATUSES.includes(input.status)) {
      return { ok: false as const, error: 'Invalid status', status: 400 }
    }
    updates.status = input.status
  }

  if (input.adminNotes !== undefined) {
    updates.admin_notes = input.adminNotes ? String(input.adminNotes) : null
  }

  if (input.assignedSupportId !== undefined) {
    updates.assigned_support_id = input.assignedSupportId || null
  }

  if (Object.keys(updates).length === 0) {
    return { ok: false as const, error: 'No fields to update', status: 400 }
  }

  const { data, error } = await service
    .from('applicants')
    .update(updates)
    .eq('id', applicantId)
    .select('*')
    .single()

  if (error) {
    console.error('[patchApplicant]', error)
    return { ok: false as const, error: error.message, status: 500 }
  }

  if (
    data.email &&
    (data.status === 'paid' || data.status === 'deposit_paid') &&
    (data.razorpay_payment_id || updates.status)
  ) {
    await ensureMemberAccountForApplicant(service, {
      applicantId: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
    })
  }

  return { ok: true as const, applicant: data }
}

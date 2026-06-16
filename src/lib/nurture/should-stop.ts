import type { SupabaseClient } from '@supabase/supabase-js'

export async function isEmailUnsubscribed(
  supabase: SupabaseClient,
  email: string
): Promise<boolean> {
  const { data } = await supabase
    .from('email_unsubscribes')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  return Boolean(data)
}

export function applicantShouldStopNurture(applicant: {
  razorpay_payment_id: string | null
  status?: string | null
}): { stop: boolean; reason?: 'paid' } {
  if (applicant.razorpay_payment_id) {
    return { stop: true, reason: 'paid' }
  }
  if (applicant.status === 'paid' || applicant.status === 'deposit_paid') {
    return { stop: true, reason: 'paid' }
  }
  return { stop: false }
}

export async function stopNurtureSequence(
  supabase: SupabaseClient,
  applicantId: string,
  reason: 'paid' | 'unsubscribed' | 'bounced' | 'manual' | 'error'
): Promise<void> {
  await supabase
    .from('email_sequences')
    .update({
      status: 'stopped',
      stop_reason: reason,
      completed_at: new Date().toISOString(),
      next_send_at: null,
    })
    .eq('applicant_id', applicantId)
    .eq('status', 'active')
}

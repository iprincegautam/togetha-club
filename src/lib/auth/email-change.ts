import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmailOtp, verifyEmailOtp } from '@/lib/auth/otp'

export async function requestEmailChange(
  service: SupabaseClient,
  input: { userId: string; newEmail: string; portal: 'member' | 'partner' }
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const newEmail = input.newEmail.trim().toLowerCase()
  if (!newEmail.includes('@')) {
    return { ok: false, error: 'Invalid email', status: 400 }
  }

  const { data: existing } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const taken = existing.users.find(
    (u) => u.email?.toLowerCase() === newEmail && u.id !== input.userId
  )
  if (taken) {
    return { ok: false, error: 'That email is already in use.', status: 400 }
  }

  const result = await sendEmailOtp(service, {
    email: newEmail,
    purpose: 'email_change',
    portal: input.portal,
    metadata: { userId: input.userId },
  })

  if (!result.ok) {
    return { ok: false, error: result.error, status: result.status }
  }
  return { ok: true }
}

export async function confirmEmailChange(
  service: SupabaseClient,
  input: { userId: string; newEmail: string; code: string; portal: 'member' | 'partner' }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const newEmail = input.newEmail.trim().toLowerCase()
  const verified = await verifyEmailOtp(service, {
    email: newEmail,
    code: input.code,
    purpose: 'email_change',
    portal: input.portal,
  })

  if (!verified.ok) return verified

  const metaUserId = verified.metadata.userId as string | undefined
  if (metaUserId && metaUserId !== input.userId) {
    return { ok: false, error: 'Invalid verification.' }
  }

  const { error: authError } = await service.auth.admin.updateUserById(input.userId, {
    email: newEmail,
    email_confirm: true,
  })
  if (authError) return { ok: false, error: authError.message }

  await service.from('profiles').update({ email: newEmail }).eq('id', input.userId)

  const { data: profile } = await service
    .from('profiles')
    .select('influencer_id')
    .eq('id', input.userId)
    .maybeSingle()

  if (profile?.influencer_id) {
    await service.from('influencers').update({ email: newEmail }).eq('id', profile.influencer_id)
  }

  return { ok: true }
}

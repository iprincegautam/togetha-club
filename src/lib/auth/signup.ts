import type { SupabaseClient } from '@supabase/supabase-js'
import type { OtpPortal } from '@/lib/auth/otp'
import {
  assertPartnerForPasswordReset,
  ensureInfluencerForPartnerSignup,
  partnerSignupPreflight,
} from '@/lib/partner-signup'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  return null
}

async function findAuthUserIdByEmail(service: SupabaseClient, email: string): Promise<string | null> {
  const { data } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const match = data.users.find((u) => u.email?.toLowerCase() === email)
  return match?.id ?? null
}

export async function assertResetEligible(
  service: SupabaseClient,
  email: string,
  portal: OtpPortal
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email)
  const userId = await findAuthUserIdByEmail(service, normalized)
  if (!userId) {
    // Don't leak — caller still returns generic success
    return { ok: true }
  }

  if (portal === 'partner') {
    await assertPartnerForPasswordReset(service, normalized)
    // Always generic success from OTP send — do not leak whether email exists
  }

  return { ok: true }
}

export async function completeMemberSignup(
  service: SupabaseClient,
  input: { email: string; password: string; name?: string | null }
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const email = normalizeEmail(input.email)
  const passwordError = validatePassword(input.password)
  if (passwordError) return { ok: false, error: passwordError }

  let userId = await findAuthUserIdByEmail(service, email)
  const isNew = !userId

  if (isNew) {
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.name ?? undefined },
    })
    if (error) {
      return { ok: false, error: error.message }
    }
    userId = created.user.id
  } else if (userId) {
    const { error } = await service.auth.admin.updateUserById(userId, {
      password: input.password,
      email_confirm: true,
    })
    if (error) return { ok: false, error: error.message }
  }

  if (!userId) {
    return { ok: false, error: 'Could not create account.' }
  }

  const { data: applicant } = await service
    .from('applicants')
    .select('id, name, phone')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: existingProfile } = await service
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  const role =
    existingProfile?.role === 'super_admin' || existingProfile?.role === 'ops'
      ? existingProfile.role
      : 'member'

  const { error: profileError } = await service.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: input.name ?? applicant?.name ?? null,
      phone: applicant?.phone ?? null,
      applicant_id: applicant?.id ?? null,
      role,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('[completeMemberSignup] profile', profileError.message)
    return { ok: false, error: 'Could not finish account setup.' }
  }

  return { ok: true, userId }
}

export async function completePartnerSignup(
  service: SupabaseClient,
  input: { email: string; password: string; name?: string | null }
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const email = normalizeEmail(input.email)
  const passwordError = validatePassword(input.password)
  if (passwordError) return { ok: false, error: passwordError }

  const preflight = await partnerSignupPreflight(service, email, input.name)
  if (!preflight.ok) return preflight

  const influencer = await ensureInfluencerForPartnerSignup(service, {
    email,
    name: input.name ?? preflight.displayName,
  })
  if (!influencer.ok) return influencer

  let userId = await findAuthUserIdByEmail(service, email)
  const isNew = !userId

  if (isNew) {
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: influencer.name },
    })
    if (error) return { ok: false, error: error.message }
    userId = created.user.id
  } else if (userId) {
    const { data: existingProfile } = await service
      .from('profiles')
      .select('role, influencer_id')
      .eq('id', userId)
      .maybeSingle()

    if (
      existingProfile?.role === 'member' &&
      !existingProfile.influencer_id
    ) {
      return {
        ok: false,
        error: 'This email is already used for a member account. Use a different email.',
      }
    }

    const { error } = await service.auth.admin.updateUserById(userId, {
      password: input.password,
      email_confirm: true,
    })
    if (error) return { ok: false, error: error.message }
  }

  if (!userId) {
    return { ok: false, error: 'Could not create account.' }
  }

  const { error: profileError } = await service.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: influencer.name,
      influencer_id: influencer.influencerId,
      role: 'influencer',
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('[completePartnerSignup] profile', profileError.message)
    return { ok: false, error: 'Could not finish account setup.' }
  }

  return { ok: true, userId }
}

export async function resetPortalPassword(
  service: SupabaseClient,
  input: { email: string; password: string; portal: OtpPortal }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normalizeEmail(input.email)
  const passwordError = validatePassword(input.password)
  if (passwordError) return { ok: false, error: passwordError }

  const userId = await findAuthUserIdByEmail(service, email)
  if (!userId) {
    return { ok: false, error: 'No account found for this email.' }
  }

  if (input.portal === 'partner') {
    const check = await assertPartnerForPasswordReset(service, email)
    if (!check.ok) return check
  }

  const { error } = await service.auth.admin.updateUserById(userId, {
    password: input.password,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { OtpPortal } from '@/lib/auth/otp'

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

export async function assertPartnerEligible(
  service: SupabaseClient,
  email: string
): Promise<{ ok: true; influencerId: string; name: string } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email)
  const { data: influencer } = await service
    .from('influencers')
    .select('id, name, email, status')
    .ilike('email', normalized)
    .maybeSingle()

  if (!influencer) {
    return {
      ok: false,
      error: 'No partner account found for this email. Ask the Togetha team to add you first.',
    }
  }

  if (influencer.status && influencer.status !== 'active') {
    return { ok: false, error: 'Your partner account is not active yet.' }
  }

  return { ok: true, influencerId: influencer.id, name: influencer.name }
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
    const check = await assertPartnerEligible(service, normalized)
    if (!check.ok) return check
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
  input: { email: string; password: string }
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const email = normalizeEmail(input.email)
  const passwordError = validatePassword(input.password)
  if (passwordError) return { ok: false, error: passwordError }

  const eligible = await assertPartnerEligible(service, email)
  if (!eligible.ok) return eligible

  let userId = await findAuthUserIdByEmail(service, email)
  const isNew = !userId

  if (isNew) {
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: eligible.name },
    })
    if (error) return { ok: false, error: error.message }
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

  const { error: profileError } = await service.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: eligible.name,
      influencer_id: eligible.influencerId,
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
    const check = await assertPartnerEligible(service, email)
    if (!check.ok) return check
  }

  const { error } = await service.auth.admin.updateUserById(userId, {
    password: input.password,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

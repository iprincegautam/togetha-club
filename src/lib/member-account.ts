import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchPackagePricePaise } from '@/lib/package-pricing'
import { sendMemberWelcomeEmail } from '@/lib/resend'

export function generateTemporaryPassword(length = 14): string {
  return randomBytes(12)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length)
}

interface ProvisionInput {
  applicantId: string
  email: string
  name: string | null
  phone: string | null
}

export interface ProvisionResult {
  userId: string
  isNewUser: boolean
  temporaryPassword?: string
}

/** Paginate auth users — listUsers page 1 alone misses accounts when you have 1000+ users. */
export async function findAuthUserIdByEmail(
  service: SupabaseClient,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      console.error('[findAuthUserIdByEmail]', error.message)
      return null
    }
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized)
    if (match) return match.id
    if (data.users.length < 1000) break
  }
  return null
}

export async function provisionMemberAccount(
  service: SupabaseClient,
  input: ProvisionInput
): Promise<ProvisionResult | null> {
  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) {
    console.error('[provisionMemberAccount] invalid email for applicant', input.applicantId)
    return null
  }

  const { data: existingProfile } = await service
    .from('profiles')
    .select('id, applicant_id, role, email, password_change_required')
    .ilike('email', email)
    .maybeSingle()

  const { data: profileByApplicant } = await service
    .from('profiles')
    .select('id, applicant_id, role, email, password_change_required')
    .eq('applicant_id', input.applicantId)
    .maybeSingle()

  const linkedProfile = profileByApplicant ?? existingProfile

  if (linkedProfile?.applicant_id === input.applicantId) {
    return { userId: linkedProfile.id, isNewUser: false }
  }

  const tempPassword = generateTemporaryPassword()
  let userId = linkedProfile?.id as string | undefined
  let isNewUser = false

  if (!userId) {
    userId = (await findAuthUserIdByEmail(service, email)) ?? undefined
  }

  if (!userId) {
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: input.name ?? undefined },
    })

    if (createError) {
      const msg = createError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        userId = (await findAuthUserIdByEmail(service, email)) ?? undefined
        if (!userId) {
          console.error(
            '[provisionMemberAccount] auth user exists but lookup failed:',
            createError.message,
            email
          )
          return null
        }
      } else {
        console.error('[provisionMemberAccount]', createError.message, email)
        return null
      }
    } else {
      userId = created.user.id
      isNewUser = true
    }
  }

  if (!userId) return null

  const profileUpdate = {
    email,
    full_name: input.name,
    phone: input.phone,
    applicant_id: input.applicantId,
    role:
      linkedProfile?.role === 'super_admin' ||
      linkedProfile?.role === 'ops' ||
      linkedProfile?.role === 'support'
        ? linkedProfile.role
        : 'member',
    password_change_required: isNewUser,
  }

  const { error: profileError } = await service.from('profiles').upsert(
    { id: userId, ...profileUpdate },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('[provisionMemberAccount] profile upsert', profileError.message, email)
    return null
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'
  const loginUrl = `${siteUrl}/account/login`
  const settingsUrl = `${siteUrl}/account/settings`

  if (isNewUser) {
    await sendMemberWelcomeEmail({
      to: email,
      name: input.name || 'there',
      loginUrl,
      settingsUrl,
      temporaryPassword: tempPassword,
    })
  } else {
    await sendMemberWelcomeEmail({
      to: email,
      name: input.name || 'there',
      loginUrl,
      settingsUrl,
      existingAccount: true,
    })
  }

  return { userId, isNewUser, temporaryPassword: isNewUser ? tempPassword : undefined }
}

/** Idempotent: link paid applicant to auth + profile; safe to call after every payment path. */
export async function ensureMemberAccountForApplicant(
  service: SupabaseClient,
  input: ProvisionInput
): Promise<ProvisionResult | null> {
  const result = await provisionMemberAccount(service, input)
  if (!result) {
    console.error(
      '[ensureMemberAccountForApplicant] failed for applicant',
      input.applicantId,
      input.email
    )
  }
  return result
}

export type ResendCredentialsResult =
  | { ok: true; email: string; temporaryPassword: string; isNewUser: boolean }
  | { ok: false; error: string }

/** Admin/support: reset member password and resend welcome email with new temp password. */
export async function resendMemberCredentials(
  service: SupabaseClient,
  applicantId: string
): Promise<ResendCredentialsResult> {
  const { data: applicant, error: fetchError } = await service
    .from('applicants')
    .select('id, email, name, phone, razorpay_payment_id, status')
    .eq('id', applicantId)
    .maybeSingle()

  if (fetchError || !applicant) {
    return { ok: false, error: 'Applicant not found' }
  }

  if (!applicant.razorpay_payment_id) {
    const status = applicant.status as string | undefined
    if (status !== 'deposit_paid' && status !== 'paid') {
      return { ok: false, error: 'No verified payment — credentials are sent after checkout completes.' }
    }
  }

  const email = applicant.email.trim().toLowerCase()
  if (!email.includes('@')) {
    return { ok: false, error: 'Applicant has no valid email' }
  }

  const tempPassword = generateTemporaryPassword()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'
  const loginUrl = `${siteUrl}/account/login`
  const settingsUrl = `${siteUrl}/account/settings`

  const { data: profileByApplicant } = await service
    .from('profiles')
    .select('id, role, email')
    .eq('applicant_id', applicantId)
    .maybeSingle()

  const { data: profileByEmail } = profileByApplicant
    ? { data: null }
    : await service
        .from('profiles')
        .select('id, role, email')
        .ilike('email', email)
        .maybeSingle()

  const existingProfile = profileByApplicant ?? profileByEmail
  let userId = existingProfile?.id as string | undefined
  let isNewUser = false

  if (!userId) {
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: applicant.name ?? undefined },
    })

    if (createError) {
      const msg = createError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        userId = (await findAuthUserIdByEmail(service, email)) ?? undefined
        if (!userId) {
          return { ok: false, error: 'Account exists but could not be located' }
        }
      } else {
        return { ok: false, error: createError.message }
      }
    } else {
      userId = created.user.id
      isNewUser = true
    }
  }

  if (!userId) {
    return { ok: false, error: 'Could not create or find member account' }
  }

  if (!isNewUser) {
    const { error: pwdError } = await service.auth.admin.updateUserById(userId, {
      password: tempPassword,
    })
    if (pwdError) {
      return { ok: false, error: pwdError.message }
    }
  }

  const { error: profileError } = await service.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: applicant.name,
      phone: applicant.phone,
      applicant_id: applicantId,
      role:
        existingProfile?.role === 'super_admin' || existingProfile?.role === 'ops'
          ? existingProfile.role
          : 'member',
      password_change_required: true,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  await sendMemberWelcomeEmail({
    to: email,
    name: applicant.name || 'there',
    loginUrl,
    settingsUrl,
    temporaryPassword: tempPassword,
  })

  return { ok: true, email, temporaryPassword: tempPassword, isNewUser }
}

export type AdminProvisionResult =
  | { ok: true; applicantId: string; email: string; temporaryPassword: string; isNewUser: boolean }
  | { ok: false; error: string }

/** Admin: create direct-lead applicant and email portal login + temp password (before payment). */
export async function adminProvisionMemberLogin(
  service: SupabaseClient,
  input: { name: string; email: string; phone: string; assignedSupportId?: string | null }
): Promise<AdminProvisionResult> {
  const email = input.email.trim().toLowerCase()
  const name = input.name.trim()
  const phone = input.phone.trim()

  if (!email.includes('@')) {
    return { ok: false, error: 'Valid email required' }
  }
  if (!name) {
    return { ok: false, error: 'Name required' }
  }

  const { data: existingApplicant } = await service
    .from('applicants')
    .select('id, email, name, phone')
    .eq('email', email)
    .maybeSingle()

  let applicantId = existingApplicant?.id as string | undefined
  const packagePricePaise = await fetchPackagePricePaise(service)

  if (!applicantId) {
    const { data: created, error: createError } = await service
      .from('applicants')
      .insert({
        email,
        name,
        phone,
        status: 'pending',
        lead_source: 'direct',
        original_amount: packagePricePaise,
        discount_amount: 0,
        final_amount: packagePricePaise,
        payment_plan: 'full',
      })
      .select('id')
      .single()

    if (createError || !created) {
      return { ok: false, error: createError?.message ?? 'Could not create applicant' }
    }
    applicantId = created.id
    if (input.assignedSupportId) {
      await service
        .from('applicants')
        .update({ assigned_support_id: input.assignedSupportId })
        .eq('id', applicantId)
    }
  } else {
    await service
      .from('applicants')
      .update({
        name,
        phone,
        lead_source: 'direct',
        original_amount: packagePricePaise,
        final_amount: packagePricePaise,
        ...(input.assignedSupportId ? { assigned_support_id: input.assignedSupportId } : {}),
      })
      .eq('id', applicantId)
  }

  const tempPassword = generateTemporaryPassword()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'
  const loginUrl = `${siteUrl}/account/login`
  const settingsUrl = `${siteUrl}/account/settings`

  const { data: profileByApplicant } = await service
    .from('profiles')
    .select('id, role, email')
    .eq('applicant_id', applicantId)
    .maybeSingle()

  const { data: profileByEmail } = profileByApplicant
    ? { data: null }
    : await service.from('profiles').select('id, role, email').ilike('email', email).maybeSingle()

  const existingProfile = profileByApplicant ?? profileByEmail
  let userId = existingProfile?.id as string | undefined
  let isNewUser = false

  if (!userId) {
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (createError) {
      const msg = createError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        userId = (await findAuthUserIdByEmail(service, email)) ?? undefined
        if (!userId) {
          return { ok: false, error: 'Account exists but could not be located' }
        }
      } else {
        return { ok: false, error: createError.message }
      }
    } else {
      userId = created.user.id
      isNewUser = true
    }
  }

  if (!userId) {
    return { ok: false, error: 'Could not create member account' }
  }

  if (!isNewUser) {
    const { error: pwdError } = await service.auth.admin.updateUserById(userId, {
      password: tempPassword,
    })
    if (pwdError) {
      return { ok: false, error: pwdError.message }
    }
  }

  const { error: profileError } = await service.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: name,
      phone,
      applicant_id: applicantId,
      role:
        existingProfile?.role === 'super_admin' || existingProfile?.role === 'ops'
          ? existingProfile.role
          : 'member',
      password_change_required: true,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  if (!applicantId) {
    return { ok: false, error: 'Applicant record missing' }
  }

  await sendMemberWelcomeEmail({
    to: email,
    name,
    loginUrl,
    settingsUrl,
    temporaryPassword: tempPassword,
  })

  return { ok: true, applicantId: applicantId!, email, temporaryPassword: tempPassword, isNewUser }
}

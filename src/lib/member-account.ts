import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
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

export async function provisionMemberAccount(
  service: SupabaseClient,
  input: ProvisionInput
): Promise<ProvisionResult | null> {
  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) return null

  const { data: existingProfile } = await service
    .from('profiles')
    .select('id, applicant_id, role, email, password_change_required')
    .ilike('email', email)
    .maybeSingle()

  if (existingProfile?.applicant_id === input.applicantId) {
    return { userId: existingProfile.id, isNewUser: false }
  }

  const tempPassword = generateTemporaryPassword()
  let userId = existingProfile?.id as string | undefined
  let isNewUser = false

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
        const { data: listData } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const match = listData.users.find((u) => u.email?.toLowerCase() === email)
        if (!match) {
          console.error('[provisionMemberAccount] user exists but not found:', createError.message)
          return null
        }
        userId = match.id
      } else {
        console.error('[provisionMemberAccount]', createError.message)
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
    role: existingProfile?.role === 'super_admin' || existingProfile?.role === 'ops'
      ? existingProfile.role
      : 'member',
    password_change_required: isNewUser,
  }

  const { error: profileError } = await service.from('profiles').upsert(
    { id: userId, ...profileUpdate },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('[provisionMemberAccount] profile upsert', profileError.message)
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
    .select('id, email, name, phone, razorpay_payment_id')
    .eq('id', applicantId)
    .maybeSingle()

  if (fetchError || !applicant) {
    return { ok: false, error: 'Applicant not found' }
  }

  if (!applicant.razorpay_payment_id) {
    return { ok: false, error: 'No verified payment — credentials are sent after checkout completes.' }
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
        const { data: listData } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const match = listData.users.find((u) => u.email?.toLowerCase() === email)
        if (!match) {
          return { ok: false, error: 'Account exists but could not be located' }
        }
        userId = match.id
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

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
    .select('id, applicant_id, role, email')
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
  }

  const { error: profileError } = await service.from('profiles').upsert(
    { id: userId, ...profileUpdate },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('[provisionMemberAccount] profile upsert', profileError.message)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'

  if (isNewUser) {
    await sendMemberWelcomeEmail({
      to: email,
      name: input.name || 'there',
      loginUrl: `${siteUrl}/account/login`,
      temporaryPassword: tempPassword,
    })
  } else {
    await sendMemberWelcomeEmail({
      to: email,
      name: input.name || 'there',
      loginUrl: `${siteUrl}/account/login`,
      existingAccount: true,
    })
  }

  return { userId, isNewUser, temporaryPassword: isNewUser ? tempPassword : undefined }
}

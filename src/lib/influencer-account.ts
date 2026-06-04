import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateTemporaryPassword } from '@/lib/member-account'
import { sendPartnerWelcomeEmail } from '@/lib/resend'

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'

export async function provisionInfluencerAccount(
  service: SupabaseClient,
  input: { influencerId: string; email: string; name: string }
): Promise<{ userId: string; temporaryPassword?: string; isNewUser: boolean } | null> {
  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) return null

  const tempPassword = generateTemporaryPassword()
  let userId: string | undefined
  let isNewUser = false

  const { data: existingProfile } = await service
    .from('profiles')
    .select('id, role')
    .ilike('email', email)
    .maybeSingle()

  if (existingProfile?.id) {
    userId = existingProfile.id
  } else {
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: input.name },
    })

    if (error) {
      console.error('[provisionInfluencerAccount]', error.message)
      return null
    }
    userId = created.user.id
    isNewUser = true
  }

  const { error: profileError } = await service.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: input.name,
      influencer_id: input.influencerId,
      role: 'influencer',
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('[provisionInfluencerAccount] profile', profileError.message)
    return null
  }

  if (!userId) return null

  const base = siteUrl()
  await sendPartnerWelcomeEmail({
    to: email,
    name: input.name,
    loginUrl: `${base}/partner/login`,
    signupUrl: `${base}/partner/signup`,
    temporaryPassword: isNewUser ? tempPassword : undefined,
    existingAccount: !isNewUser,
  })

  return {
    userId,
    isNewUser,
    temporaryPassword: isNewUser ? tempPassword : undefined,
  }
}

export function generatePromoCode(prefix = 'TOGETHA'): string {
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}${suffix}`
}

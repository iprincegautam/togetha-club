import type { SupabaseClient } from '@supabase/supabase-js'
import { generatePromoCode } from '@/lib/influencer-account'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export type PartnerSignupMode = 'claim' | 'register'

export async function partnerSignupPreflight(
  service: SupabaseClient,
  email: string,
  name?: string | null
): Promise<
  | { ok: true; mode: PartnerSignupMode; influencerId?: string; displayName?: string }
  | { ok: false; error: string }
> {
  const normalized = normalizeEmail(email)

  const { data: influencer } = await service
    .from('influencers')
    .select('id, name, email, status')
    .ilike('email', normalized)
    .maybeSingle()

  if (influencer) {
    if (influencer.status && influencer.status !== 'active') {
      return { ok: false, error: 'Your partner account is not active yet. Contact Togetha support.' }
    }
    return {
      ok: true,
      mode: 'claim',
      influencerId: influencer.id,
      displayName: influencer.name,
    }
  }

  const trimmedName = name?.trim()
  if (!trimmedName) {
    return { ok: false, error: 'Enter your name to create a new partner account.' }
  }

  const { data: profile } = await service
    .from('profiles')
    .select('id, role, influencer_id')
    .ilike('email', normalized)
    .maybeSingle()

  if (profile?.role === 'member' && !profile.influencer_id) {
    return {
      ok: false,
      error: 'This email is already used for a member account. Use a different email or sign in at My booking.',
    }
  }

  if (profile?.influencer_id) {
    return { ok: true, mode: 'claim', influencerId: profile.influencer_id }
  }

  if (profile?.role === 'super_admin' || profile?.role === 'ops') {
    return { ok: false, error: 'This email is reserved for admin use. Use a different email for partner signup.' }
  }

  return { ok: true, mode: 'register', displayName: trimmedName }
}

/** Password reset: must already have a partner profile (no self-register on reset). */
export async function assertPartnerForPasswordReset(
  service: SupabaseClient,
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email)

  const { data: influencer } = await service
    .from('influencers')
    .select('id, status')
    .ilike('email', normalized)
    .maybeSingle()

  if (influencer) {
    if (influencer.status && influencer.status !== 'active') {
      return { ok: false, error: 'Your partner account is not active yet.' }
    }
    return { ok: true }
  }

  const { data: profile } = await service
    .from('profiles')
    .select('influencer_id, role')
    .ilike('email', normalized)
    .maybeSingle()

  if (profile?.influencer_id && profile.role === 'influencer') {
    return { ok: true }
  }

  return { ok: false, error: 'No partner account found for this email.' }
}

export async function ensureInfluencerForPartnerSignup(
  service: SupabaseClient,
  input: { email: string; name?: string | null }
): Promise<{ ok: true; influencerId: string; name: string } | { ok: false; error: string }> {
  const email = normalizeEmail(input.email)

  const { data: existing } = await service
    .from('influencers')
    .select('id, name, status')
    .ilike('email', email)
    .maybeSingle()

  if (existing) {
    if (existing.status && existing.status !== 'active') {
      return { ok: false, error: 'Your partner account is not active yet.' }
    }
    return { ok: true, influencerId: existing.id, name: existing.name }
  }

  const displayName = input.name?.trim() || email.split('@')[0]
  const { data: created, error } = await service
    .from('influencers')
    .insert({
      name: displayName,
      email,
      status: 'active',
      notes: 'Self-registered via partner portal',
    })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'An account with this email already exists. Try signing in.' }
    }
    console.error('[ensureInfluencerForPartnerSignup]', error.message)
    return { ok: false, error: 'Could not create partner profile.' }
  }

  await ensureDefaultPartnerPromoCode(service, created.id)

  return { ok: true, influencerId: created.id, name: created.name }
}

/** First promo code so new partners can share a link immediately; admin can add more in Affiliates. */
export async function ensureDefaultPartnerPromoCode(
  service: SupabaseClient,
  influencerId: string
): Promise<void> {
  const { count } = await service
    .from('promo_codes')
    .select('id', { count: 'exact', head: true })
    .eq('influencer_id', influencerId)

  if (count && count > 0) return

  let code = generatePromoCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await service.from('promo_codes').insert({
      code,
      influencer_id: influencerId,
      discount_type: 'fixed_inr',
      discount_value: 2000,
      commission_amount: 0,
      grants_priority: false,
      max_uses: null,
      active: true,
      batch_slugs: ['batch-a', 'batch-b'],
    })
    if (!error) return
    if (error.code !== '23505') {
      console.error('[ensureDefaultPartnerPromoCode]', error.message)
      return
    }
    code = generatePromoCode()
  }
}

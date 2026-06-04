import { createServerAuthClient, tryCreateServiceRoleClient } from '@/lib/supabase/server'
import type { ProfileRow } from '@/lib/auth/roles'

export async function getPartnerContext() {
  const supabase = await createServerAuthClient()
  if (!supabase) {
    return { supabase: null, session: null, profile: null, influencer: null }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { supabase, session: null, profile: null, influencer: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile?.influencer_id) {
    return { supabase, session, profile: profile as ProfileRow | null, influencer: null }
  }

  const { data: influencer } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', profile.influencer_id)
    .maybeSingle()

  return {
    supabase,
    session,
    profile: profile as ProfileRow,
    influencer,
  }
}

export function userHasPartnerAccess(
  profile: Pick<ProfileRow, 'role' | 'influencer_id'> | null | undefined
): boolean {
  return profile?.role === 'influencer' && Boolean(profile.influencer_id)
}

export async function requirePartnerApiAccess() {
  const ctx = await getPartnerContext()
  if (!ctx.session) {
    return { error: 'Unauthorized' as const, status: 401 as const }
  }
  if (!userHasPartnerAccess(ctx.profile) || !ctx.influencer) {
    return { error: 'Not an influencer account' as const, status: 403 as const }
  }

  const service = tryCreateServiceRoleClient()
  if (!service) {
    return { error: 'Server configuration error' as const, status: 500 as const }
  }

  return { ...ctx, service }
}

export async function requirePartnerSession() {
  const ctx = await getPartnerContext()
  if (!ctx.session || !userHasPartnerAccess(ctx.profile)) return null
  return ctx
}

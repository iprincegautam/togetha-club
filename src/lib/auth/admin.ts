import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createServerAuthClient,
  createServiceRoleClient,
  tryCreateServiceRoleClient,
} from '@/lib/supabase/server'
import {
  type ProfileRow,
  isBootstrapAdminEmail,
  userHasAdminAccess,
} from '@/lib/auth/roles'

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, applicant_id, influencer_id')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data as ProfileRow
}

async function ensureBootstrapAdminProfile(
  userId: string,
  email: string,
  profile: ProfileRow | null
): Promise<ProfileRow | null> {
  if (!isBootstrapAdminEmail(email)) return profile

  const service = tryCreateServiceRoleClient()
  if (!service) return profile

  const normalized = email.trim().toLowerCase()
  await service.from('profiles').upsert(
    {
      id: userId,
      email: normalized,
      full_name: profile?.full_name ?? null,
      role: 'ops',
    },
    { onConflict: 'id' }
  )

  return fetchProfile(service, userId)
}

export async function getAdminContext() {
  const supabase = await createServerAuthClient()
  if (!supabase) {
    return { supabase: null, session: null, profile: null, isAdmin: false }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { supabase, session: null, profile: null, isAdmin: false }
  }

  let profile = await fetchProfile(supabase, user.id)

  if (
    user.email &&
    !userHasAdminAccess(profile, user.email) &&
    isBootstrapAdminEmail(user.email)
  ) {
    profile = await ensureBootstrapAdminProfile(user.id, user.email, profile)
  }

  const isAdmin = userHasAdminAccess(profile, user.email)

  return { supabase, session: { user }, profile, isAdmin }
}

/** For server pages — redirects handled by caller */
export async function requireAdminContext() {
  const ctx = await getAdminContext()
  if (!ctx.session || !ctx.isAdmin) {
    return null
  }
  return ctx
}

/** For admin mutation API routes */
export async function requireAdminApiAccess() {
  const ctx = await getAdminContext()
  if (!ctx.session || !ctx.isAdmin) {
    return { error: 'Unauthorized' as const, status: 401 as const }
  }

  const service = tryCreateServiceRoleClient()
  if (!service) {
    return { error: 'Server configuration error' as const, status: 500 as const }
  }

  return { ...ctx, service }
}

export async function ensureProfileForUser(userId: string, email: string, fullName?: string | null) {
  const service = createServiceRoleClient()
  const { data: existing } = await service.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (existing) return

  await service.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName ?? null,
    role: 'member',
  })
}

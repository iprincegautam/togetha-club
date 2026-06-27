import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerAuthClient, tryCreateServiceRoleClient } from '@/lib/supabase/server'
import type { ProfileRow } from '@/lib/auth/roles'
import { isSupportRole } from '@/lib/auth/roles'
import {
  hasPermission,
  parsePermissions,
  type SupportPermission,
  type SupportViewScope,
} from '@/lib/support/permissions'

export type SupportStaffRow = {
  profile_id: string
  view_scope: SupportViewScope
  is_active: boolean
}

export type SupportContext = {
  supabase: SupabaseClient
  session: { user: { id: string; email?: string } }
  profile: ProfileRow
  staff: SupportStaffRow
  permissions: Set<SupportPermission>
}

export function userHasSupportAccess(
  profile: Pick<ProfileRow, 'role'> | null | undefined,
  staff: Pick<SupportStaffRow, 'is_active'> | null | undefined
): boolean {
  return isSupportRole(profile?.role) && Boolean(staff?.is_active)
}

async function fetchSupportStaff(
  supabase: SupabaseClient,
  profileId: string
): Promise<SupportStaffRow | null> {
  const { data } = await supabase
    .from('support_staff')
    .select('profile_id, view_scope, is_active')
    .eq('profile_id', profileId)
    .maybeSingle()

  return data as SupportStaffRow | null
}

async function fetchSupportPermissions(
  supabase: SupabaseClient,
  profileId: string
): Promise<Set<SupportPermission>> {
  const { data } = await supabase
    .from('support_permissions')
    .select('permission')
    .eq('profile_id', profileId)

  return parsePermissions(data)
}

export async function getSupportContext(): Promise<
  | { supabase: null; session: null; profile: null; staff: null; permissions: Set<SupportPermission> }
  | {
      supabase: SupabaseClient
      session: null
      profile: ProfileRow | null
      staff: SupportStaffRow | null
      permissions: Set<SupportPermission>
    }
  | SupportContext
> {
  const supabase = await createServerAuthClient()
  if (!supabase) {
    return { supabase: null, session: null, profile: null, staff: null, permissions: new Set() }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { supabase, session: null, profile: null, staff: null, permissions: new Set() }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const typedProfile = profile as ProfileRow | null
  const staff = typedProfile ? await fetchSupportStaff(supabase, user.id) : null
  const permissions: Set<SupportPermission> = typedProfile
    ? await fetchSupportPermissions(supabase, user.id)
    : new Set()

  if (!typedProfile || !staff || !userHasSupportAccess(typedProfile, staff)) {
    return { supabase, session: null, profile: typedProfile, staff, permissions }
  }

  return {
    supabase,
    session: { user: { id: user.id, email: user.email } },
    profile: typedProfile,
    staff,
    permissions,
  }
}

export async function requireSupportSession() {
  const ctx = await getSupportContext()
  if (!ctx.session || !ctx.profile || !ctx.staff) return null
  return ctx as SupportContext
}

export async function requireSupportApiAccess(permission?: SupportPermission) {
  const ctx = await getSupportContext()

  if (!ctx.session || !ctx.profile || !ctx.staff) {
    return { error: 'Unauthorized' as const, status: 401 as const }
  }

  if (!userHasSupportAccess(ctx.profile, ctx.staff)) {
    return { error: 'Not a support account' as const, status: 403 as const }
  }

  if (permission && !hasPermission(ctx.permissions, permission)) {
    return { error: 'Permission denied' as const, status: 403 as const }
  }

  const service = tryCreateServiceRoleClient()
  if (!service) {
    return { error: 'Server configuration error' as const, status: 500 as const }
  }

  return { ...(ctx as SupportContext), service }
}

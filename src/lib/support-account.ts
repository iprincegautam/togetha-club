import type { SupabaseClient } from '@supabase/supabase-js'
import { findAuthUserIdByEmail, generateTemporaryPassword } from '@/lib/member-account'
import { sendSupportWelcomeEmail } from '@/lib/resend'
import {
  DEFAULT_SUPPORT_PERMISSIONS,
  DEFAULT_SUPPORT_VIEW_SCOPE,
  type SupportPermission,
  type SupportViewScope,
} from '@/lib/support/permissions'

export type ProvisionSupportResult =
  | {
      ok: true
      profileId: string
      email: string
      temporaryPassword: string
      isNewUser: boolean
    }
  | { ok: false; error: string }

export async function provisionSupportAccount(
  service: SupabaseClient,
  input: {
    email: string
    fullName: string
    viewScope?: SupportViewScope
    permissions?: SupportPermission[]
    grantedBy?: string
    assignApplicantsOnProvision?: boolean
  }
): Promise<ProvisionSupportResult> {
  const email = input.email.trim().toLowerCase()
  const fullName = input.fullName.trim()

  if (!email.includes('@')) {
    return { ok: false, error: 'Valid email required' }
  }
  if (!fullName) {
    return { ok: false, error: 'Name required' }
  }

  const tempPassword = generateTemporaryPassword()
  let userId = (await findAuthUserIdByEmail(service, email)) ?? undefined
  let isNewUser = false

  if (!userId) {
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
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
    return { ok: false, error: 'Could not create support account' }
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
      full_name: fullName,
      role: 'support',
      password_change_required: true,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  const viewScope = input.viewScope ?? DEFAULT_SUPPORT_VIEW_SCOPE
  const { error: staffError } = await service.from('support_staff').upsert(
    {
      profile_id: userId,
      view_scope: viewScope,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' }
  )

  if (staffError) {
    return { ok: false, error: staffError.message }
  }

  const permissions = input.permissions ?? DEFAULT_SUPPORT_PERMISSIONS
  await service.from('support_permissions').delete().eq('profile_id', userId)

  if (permissions.length > 0) {
    const { error: permError } = await service.from('support_permissions').insert(
      permissions.map((permission) => ({
        profile_id: userId,
        permission,
        granted_by: input.grantedBy ?? null,
      }))
    )
    if (permError) {
      return { ok: false, error: permError.message }
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'
  await sendSupportWelcomeEmail({
    to: email,
    name: fullName,
    loginUrl: `${siteUrl}/support/login`,
    temporaryPassword: tempPassword,
  })

  return { ok: true, profileId: userId, email, temporaryPassword: tempPassword, isNewUser }
}

export async function updateSupportStaff(
  service: SupabaseClient,
  profileId: string,
  input: {
    fullName?: string
    viewScope?: SupportViewScope
    isActive?: boolean
    permissions?: SupportPermission[]
    grantedBy?: string
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.fullName !== undefined) {
    const { error: profileError } = await service
      .from('profiles')
      .update({ full_name: input.fullName.trim() || null })
      .eq('id', profileId)
    if (profileError) return { ok: false, error: profileError.message }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.viewScope !== undefined) updates.view_scope = input.viewScope
  if (input.isActive !== undefined) updates.is_active = input.isActive

  if (Object.keys(updates).length > 1) {
    const { error } = await service.from('support_staff').update(updates).eq('profile_id', profileId)
    if (error) return { ok: false, error: error.message }
  }

  if (input.permissions !== undefined) {
    await service.from('support_permissions').delete().eq('profile_id', profileId)
    if (input.permissions.length > 0) {
      const { error: permError } = await service.from('support_permissions').insert(
        input.permissions.map((permission) => ({
          profile_id: profileId,
          permission,
          granted_by: input.grantedBy ?? null,
        }))
      )
      if (permError) return { ok: false, error: permError.message }
    }
  }

  return { ok: true }
}

export async function listSupportStaff(service: SupabaseClient) {
  const { data: staffRows, error } = await service
    .from('support_staff')
    .select('profile_id, view_scope, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  const profileIds = (staffRows ?? []).map((row) => row.profile_id)
  if (profileIds.length === 0) return []

  const { data: profiles } = await service
    .from('profiles')
    .select('id, email, full_name, role')
    .in('id', profileIds)

  const { data: permissions } = await service
    .from('support_permissions')
    .select('profile_id, permission')
    .in('profile_id', profileIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const permMap = new Map<string, string[]>()
  for (const row of permissions ?? []) {
    const list = permMap.get(row.profile_id) ?? []
    list.push(row.permission)
    permMap.set(row.profile_id, list)
  }

  return (staffRows ?? []).map((staff) => ({
    ...staff,
    profile: profileMap.get(staff.profile_id) ?? null,
    permissions: permMap.get(staff.profile_id) ?? [],
  }))
}

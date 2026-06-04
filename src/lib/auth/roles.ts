export type UserRole = 'super_admin' | 'ops' | 'member' | 'influencer'

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'ops']

export interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  applicant_id: string | null
  influencer_id: string | null
  phone?: string | null
  city?: string | null
  bio?: string | null
  avatar_url?: string | null
  emergency_contact?: string | null
  dietary_notes?: string | null
  instagram_handle?: string | null
}

export function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isBootstrapAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  const allowlist = parseAdminEmails()
  return allowlist.length > 0 && allowlist.includes(normalized)
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'super_admin' || role === 'ops'
}

export function userHasAdminAccess(
  profile: Pick<ProfileRow, 'role'> | null | undefined,
  email: string | undefined | null
): boolean {
  if (profile && isAdminRole(profile.role)) return true
  return isBootstrapAdminEmail(email)
}

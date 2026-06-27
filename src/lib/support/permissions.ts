export const SUPPORT_PERMISSIONS = [
  'applicants.view',
  'applicants.notes',
  'applicants.status',
  'applicants.provision_login',
  'applicants.resend_credentials',
  'applicants.send_balance_link',
  'applicants.approve_profile',
  'waitlist.view',
  'waitlist.manage',
  'dm.annotate',
] as const

export type SupportPermission = (typeof SUPPORT_PERMISSIONS)[number]

export type SupportViewScope = 'assigned_only' | 'all'

export const DEFAULT_SUPPORT_PERMISSIONS: SupportPermission[] = [
  'applicants.view',
  'applicants.notes',
  'applicants.status',
  'applicants.provision_login',
  'applicants.resend_credentials',
  'applicants.send_balance_link',
]

export const SUPPORT_PERMISSION_LABELS: Record<SupportPermission, string> = {
  'applicants.view': 'View applicants',
  'applicants.notes': 'Edit internal notes',
  'applicants.status': 'Change applicant status',
  'applicants.provision_login': 'Provision direct member login',
  'applicants.resend_credentials': 'Resend member credentials',
  'applicants.send_balance_link': 'Send balance payment link',
  'applicants.approve_profile': 'Approve member profile / KYC',
  'waitlist.view': 'View waitlist',
  'waitlist.manage': 'Manage waitlist',
  'dm.annotate': 'DM annotations',
}

export function isSupportPermission(value: string): value is SupportPermission {
  return (SUPPORT_PERMISSIONS as readonly string[]).includes(value)
}

export function hasPermission(
  permissions: Set<SupportPermission> | SupportPermission[],
  permission: SupportPermission
): boolean {
  if (permissions instanceof Set) return permissions.has(permission)
  return permissions.includes(permission)
}

export function parsePermissions(rows: { permission: string }[] | null | undefined): Set<SupportPermission> {
  const set = new Set<SupportPermission>()
  for (const row of rows ?? []) {
    if (isSupportPermission(row.permission)) set.add(row.permission)
  }
  return set
}

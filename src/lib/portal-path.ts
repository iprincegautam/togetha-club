/** Member, partner, and admin app areas — no marketing site chrome. */
export function isPortalPath(pathname: string): boolean {
  return (
    pathname.startsWith('/account') ||
    pathname.startsWith('/partner') ||
    pathname.startsWith('/admin')
  )
}

/** Auth screens: never show portal sidebar, even if a session cookie exists. */
export const ACCOUNT_AUTH_PATHS = new Set([
  '/account/login',
  '/account/signup',
  '/account/forgot-password',
  '/account/reset-password',
])

export const PARTNER_AUTH_PATHS = new Set([
  '/partner/login',
  '/partner/signup',
  '/partner/forgot-password',
  '/partner/reset-password',
])

export const ADMIN_AUTH_PATHS = new Set(['/admin/login'])

export function isAccountAuthPath(pathname: string): boolean {
  return ACCOUNT_AUTH_PATHS.has(pathname)
}

export function isPartnerAuthPath(pathname: string): boolean {
  return PARTNER_AUTH_PATHS.has(pathname)
}

export function isAdminAuthPath(pathname: string): boolean {
  return ADMIN_AUTH_PATHS.has(pathname)
}

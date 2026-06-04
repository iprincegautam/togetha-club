/** Member, partner, and admin app areas — no marketing site chrome. */
export function isPortalPath(pathname: string): boolean {
  return (
    pathname.startsWith('/account') ||
    pathname.startsWith('/partner') ||
    pathname.startsWith('/admin')
  )
}

import { headers } from 'next/headers'
import PortalShell from '@/components/layout/PortalShell'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { ROUTES } from '@/constants/routes'
import { requireSupportSession } from '@/lib/auth/support'
import { isSupportAuthPath } from '@/lib/portal-path'
import '@/components/admin/admin.css'
import '@/components/account/account.css'
import '@/styles/portal-nav.css'
import '@/styles/portal-shell.css'
import '@/styles/portal-extensions.css'

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') ?? ''
  const isAuthPage =
    headerList.get('x-portal-auth-page') === '1' || isSupportAuthPath(pathname)

  const ctx = await requireSupportSession()
  const showNav = Boolean(ctx?.session) && !isAuthPage

  if (!showNav) {
    return (
      <div className="account-layout portal-guest-wrap">
        <div className="portal-back-bar portal-back-bar--light">
          <PortalBackLink variant="light" />
        </div>
        <div className="account-page">{children}</div>
      </div>
    )
  }

  return (
    <div className="account-layout portal-layout">
      <PortalShell
        variant="support"
        brand="✦ Togetha Support"
        homeHref={ROUTES.support}
        signOutHref={ROUTES.supportLogin}
        supportPermissions={Array.from(ctx!.permissions)}
      >
        {children}
      </PortalShell>
    </div>
  )
}

import PortalShell from '@/components/layout/PortalShell'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { ROUTES } from '@/constants/routes'
import { requirePartnerSession } from '@/lib/auth/partner'
import { PARTNER_PORTAL_NAV } from '@/lib/portal-nav'
import '@/components/account/account.css'
import '@/components/admin/admin.css'
import '@/styles/portal-nav.css'
import '@/styles/portal-shell.css'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requirePartnerSession()
  const showNav = Boolean(ctx?.session)

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
        variant="partner"
        brand="✦ Partner Portal"
        homeHref={ROUTES.partner}
        nav={PARTNER_PORTAL_NAV}
        signOutHref={ROUTES.partnerLogin}
      >
        {children}
      </PortalShell>
    </div>
  )
}

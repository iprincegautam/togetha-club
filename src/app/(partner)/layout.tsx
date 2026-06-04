import { headers } from 'next/headers'
import PortalShell from '@/components/layout/PortalShell'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { ROUTES } from '@/constants/routes'
import { requirePartnerSession } from '@/lib/auth/partner'
import '@/components/account/account.css'
import '@/components/admin/admin.css'
import '@/styles/portal-nav.css'
import '@/styles/portal-shell.css'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerList = await headers()
  const isAuthPage = headerList.get('x-portal-auth-page') === '1'
  const ctx = await requirePartnerSession()
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
        variant="partner"
        brand="✦ Partner Portal"
        homeHref={ROUTES.partner}
        signOutHref={ROUTES.partnerLogin}
      >
        {children}
      </PortalShell>
    </div>
  )
}

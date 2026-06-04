import { headers } from 'next/headers'
import PortalShell from '@/components/layout/PortalShell'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { ROUTES } from '@/constants/routes'
import { requireMemberSession } from '@/lib/auth/member'
import '@/components/account/account.css'
import '@/components/admin/admin.css'
import '@/styles/portal-nav.css'
import '@/styles/portal-shell.css'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerList = await headers()
  const isAuthPage = headerList.get('x-portal-auth-page') === '1'
  const ctx = await requireMemberSession()
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
    <div className="account-layout">
      <PortalShell
        variant="member"
        brand="✦ My Togetha.Club"
        homeHref={ROUTES.account}
        signOutHref={ROUTES.accountLogin}
      >
        {children}
      </PortalShell>
    </div>
  )
}

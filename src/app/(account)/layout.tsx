import AccountNav from '@/components/account/AccountNav'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { requireMemberSession } from '@/lib/auth/member'
import '@/components/account/account.css'
import '@/styles/portal-nav.css'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireMemberSession()
  const showNav = Boolean(ctx?.session)

  return (
    <div className="account-layout">
      {showNav ? (
        <AccountNav />
      ) : (
        <div className="portal-back-bar portal-back-bar--light">
          <PortalBackLink variant="light" />
        </div>
      )}
      <div className="account-page">{children}</div>
    </div>
  )
}

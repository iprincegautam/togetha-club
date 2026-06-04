import PartnerNav from '@/components/partner/PartnerNav'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { requirePartnerSession } from '@/lib/auth/partner'
import '@/components/account/account.css'
import '@/styles/portal-nav.css'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requirePartnerSession()
  const showNav = Boolean(ctx?.session)

  return (
    <div className="account-layout">
      {showNav ? (
        <PartnerNav />
      ) : (
        <div className="portal-back-bar portal-back-bar--light">
          <PortalBackLink variant="light" />
        </div>
      )}
      <div className="account-page">{children}</div>
    </div>
  )
}

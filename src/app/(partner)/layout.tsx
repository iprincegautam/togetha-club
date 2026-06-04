import PartnerNav from '@/components/partner/PartnerNav'
import { requirePartnerSession } from '@/lib/auth/partner'
import '@/components/account/account.css'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requirePartnerSession()
  const showNav = Boolean(ctx?.session)

  return (
    <div className="account-layout">
      {showNav && <PartnerNav />}
      <div className="account-page">{children}</div>
    </div>
  )
}

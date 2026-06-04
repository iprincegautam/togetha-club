import AccountNav from '@/components/account/AccountNav'
import { requireMemberSession } from '@/lib/auth/member'
import '@/components/account/account.css'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireMemberSession()
  const showNav = Boolean(ctx?.session)

  return (
    <div className="account-layout">
      {showNav && <AccountNav />}
      <div className="account-page">{children}</div>
    </div>
  )
}

import { headers } from 'next/headers'
import PortalShell from '@/components/layout/PortalShell'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { ROUTES } from '@/constants/routes'
import { getAdminSession } from '@/lib/supabase/server'
import '@/components/admin/admin.css'
import '@/styles/portal-nav.css'
import '@/styles/portal-shell.css'
import '@/styles/portal-extensions.css'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerList = await headers()
  const isAuthPage = headerList.get('x-portal-auth-page') === '1'
  const { session } = await getAdminSession()

  if (!session || isAuthPage) {
    return (
      <div className="admin-layout portal-guest-wrap">
        <div className="portal-back-bar portal-back-bar--light">
          <PortalBackLink variant="light" />
        </div>
        <div className="admin-layout-body">{children}</div>
      </div>
    )
  }

  return (
    <div className="admin-layout portal-layout">
      <PortalShell
        variant="admin"
        brand="✦ Togetha.Club Admin"
        homeHref={ROUTES.admin}
        signOutHref={ROUTES.adminLogin}
      >
        {children}
      </PortalShell>
    </div>
  )
}

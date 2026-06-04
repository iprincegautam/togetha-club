import PortalShell from '@/components/layout/PortalShell'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { ROUTES } from '@/constants/routes'
import { getAdminSession } from '@/lib/supabase/server'
import { ADMIN_PORTAL_NAV } from '@/lib/portal-nav'
import '@/components/admin/admin.css'
import '@/styles/portal-nav.css'
import '@/styles/portal-shell.css'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = await getAdminSession()

  if (!session) {
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
        nav={ADMIN_PORTAL_NAV}
        signOutHref={ROUTES.adminLogin}
      >
        {children}
      </PortalShell>
    </div>
  )
}

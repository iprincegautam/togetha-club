import { headers } from 'next/headers'
import PortalShell from '@/components/layout/PortalShell'
import PortalBackLink from '@/components/layout/PortalBackLink'
import AdminAuthActions from '@/components/admin/AdminAuthActions'
import { ROUTES } from '@/constants/routes'
import { getAdminContext } from '@/lib/auth/admin'
import { isAdminAuthPath } from '@/lib/portal-path'
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
  const pathname = headerList.get('x-pathname') ?? ''
  const isAuthPage =
    headerList.get('x-portal-auth-page') === '1' || isAdminAuthPath(pathname)

  if (isAuthPage) {
    return (
      <div className="admin-layout portal-guest-wrap">
        <div className="portal-back-bar portal-back-bar--light">
          <PortalBackLink variant="light" />
        </div>
        <div className="admin-layout-body">{children}</div>
      </div>
    )
  }

  const ctx = await getAdminContext()

  if (!ctx.session || !ctx.isAdmin) {
    return (
      <div className="admin-layout portal-guest-wrap">
        <div className="portal-back-bar portal-back-bar--light">
          <PortalBackLink variant="light" />
        </div>
        <div className="admin-layout-body">
          <div className="admin-page">
            <AdminAuthActions message="Admin session expired or access denied." />
          </div>
        </div>
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

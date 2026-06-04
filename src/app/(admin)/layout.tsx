import AdminNav from '@/components/admin/AdminNav'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { getAdminSession } from '@/lib/supabase/server'
import '@/components/admin/admin.css'
import '@/styles/portal-nav.css'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = await getAdminSession()

  return (
    <div className="admin-layout">
      {session ? (
        <AdminNav />
      ) : (
        <div className="portal-back-bar portal-back-bar--light">
          <PortalBackLink variant="light" />
        </div>
      )}
      <div className="admin-layout-body">{children}</div>
    </div>
  )
}

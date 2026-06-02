import AdminNav from '@/components/admin/AdminNav'
import { getAdminSession } from '@/lib/supabase/server'
import '@/components/admin/admin.css'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = await getAdminSession()

  if (!session) {
    return <div className="admin-layout">{children}</div>
  }

  return (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-layout-body">{children}</div>
    </div>
  )
}

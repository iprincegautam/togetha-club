import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminInternDetail from '@/components/admin/AdminInternDetail'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'
import '@/components/admin/admin.css'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return buildMetadata(`Founding team — Admin`, `Review application ${id.slice(0, 8)}`)
}

export default async function AdminInternDetailPage({ params }: PageProps) {
  const { id } = await params
  const auth = await requireAdminApiAccess()

  if (!auth || 'error' in auth) {
    notFound()
  }

  const { data, error } = await auth.service
    .from('intern_applications')
    .select(
      'id, full_name, email, phone, college, course, year_of_study, track, portfolio_url, why_togetha, resume_storage_path, status, assignment_sent_at, notes, created_at'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    notFound()
  }

  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <Link href={ROUTES.adminInterns} className="admin-inline-link">
          ← All founding team applications
        </Link>
        <AdminInternDetail application={data} />
      </div>
    </div>
  )
}

import AdminCreatorDetail from '@/components/admin/AdminCreatorDetail'
import { buildMetadata } from '@/lib/metadata'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return buildMetadata(`Creator ${id} — Admin`, 'Partner creator detail.')
}

export default async function AdminCreatorDetailPage({ params }: PageProps) {
  const { id } = await params
  return (
    <div className="admin-page">
      <AdminCreatorDetail id={id} />
    </div>
  )
}

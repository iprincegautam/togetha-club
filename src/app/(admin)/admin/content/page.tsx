import AdminContentReview from '@/components/admin/AdminContentReview'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Content Review — Admin', 'Review partner content submissions.')
}

export default function AdminContentPage() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Content review</h1>
      <AdminContentReview />
    </div>
  )
}

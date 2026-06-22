import AnnotateTool from '@/components/admin/AnnotateTool'
import { requireAdminContext } from '@/lib/auth/admin'
import { buildMetadata } from '@/lib/metadata'
import { redirect } from 'next/navigation'

export function generateMetadata() {
  return buildMetadata(
    'DM Annotations — Togetha.Club Admin',
    'Annotate Instagram DM agent responses for training.'
  )
}

export default async function AdminAnnotatePage() {
  const ctx = await requireAdminContext()
  if (!ctx) {
    redirect('/admin/login')
  }

  const annotatorName =
    ctx.profile?.full_name ?? ctx.session.user.email ?? 'Admin'

  return (
    <div className="admin-page">
      <p className="apply-eyebrow">✦ Admin ✦</p>
      <h1 className="admin-title">DM Annotations</h1>
      <p className="admin-sub" style={{ marginBottom: 24 }}>
        Review real Instagram DMs, score agent replies, and write winning responses for training.
      </p>
      <AnnotateTool annotatorName={annotatorName} />
    </div>
  )
}

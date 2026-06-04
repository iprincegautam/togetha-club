import Link from 'next/link'
import AdminDeparturesManager from '@/components/admin/AdminDeparturesManager'
import { BATCH_META } from '@/constants/batches'
import { buildMetadata } from '@/lib/metadata'
import '@/components/admin/admin.css'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  return buildMetadata(`Departures — ${slug}`, 'Manage trip departure dates.')
}

export default async function AdminBatchDeparturesPage({ params }: PageProps) {
  const { slug } = await params
  const meta = BATCH_META[slug as keyof typeof BATCH_META]

  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="admin-title">Departure dates — {meta?.label ?? slug}</h1>
        <p className="apply-sub" style={{ textAlign: 'left' }}>
          These dates appear on the batches page and apply form.{' '}
          <Link href="/admin/batches" className="admin-inline-link">← All batches</Link>
        </p>
        <AdminDeparturesManager batchSlug={slug} />
      </div>
    </div>
  )
}

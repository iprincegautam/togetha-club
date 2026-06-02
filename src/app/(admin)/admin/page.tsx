import AdminApplicantsTable from '@/components/admin/AdminApplicantsTable'
import { mapApplicantRow } from '@/lib/applicants'
import { getAdminSession } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'
import '@/components/admin/admin.css'

export function generateMetadata() {
  return buildMetadata(
    'Admin — Togetha.Club',
    'Review applicants, payment status, and batch assignments.'
  )
}

async function fetchApplicants() {
  const { supabase, session } = await getAdminSession()
  if (!supabase || !session) return []

  const { data, error } = await supabase
    .from('applicants')
    .select(
      `
      id,
      name,
      email,
      gender,
      batch_slug,
      quiz_score,
      status,
      created_at,
      batches ( name, slug )
    `
    )
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(mapApplicantRow)
}

export default async function AdminPage() {
  const applicants = await fetchApplicants()

  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="admin-title">Applicants</h1>
        <p className="apply-sub" style={{ textAlign: 'left', marginBottom: 0 }}>
          Review applications, payment status, and batch assignments.
        </p>

        <AdminApplicantsTable applicants={applicants} />
      </div>
    </div>
  )
}

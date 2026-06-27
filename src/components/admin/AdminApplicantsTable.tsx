import ApplicantOpsList, { type ApplicantOpsRow } from '@/components/applicant-ops/ApplicantOpsList'
import { adminApplicantHref } from '@/lib/admin-applicant-filters'

export type AdminApplicantRow = ApplicantOpsRow

interface AdminApplicantsTableProps {
  applicants: AdminApplicantRow[]
}

export default function AdminApplicantsTable({ applicants }: AdminApplicantsTableProps) {
  return (
    <ApplicantOpsList
      applicants={applicants}
      detailHref={(id, filters) => adminApplicantHref(id, filters)}
    />
  )
}

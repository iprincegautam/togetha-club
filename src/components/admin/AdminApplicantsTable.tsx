import ApplicantOpsList, { type ApplicantOpsRow } from '@/components/applicant-ops/ApplicantOpsList'

export type AdminApplicantRow = ApplicantOpsRow

interface AdminApplicantsTableProps {
  applicants: AdminApplicantRow[]
}

export default function AdminApplicantsTable({ applicants }: AdminApplicantsTableProps) {
  return <ApplicantOpsList applicants={applicants} variant="admin" />
}

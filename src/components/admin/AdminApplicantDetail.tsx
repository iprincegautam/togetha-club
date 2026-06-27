import ApplicantOpsDetail, {
  ADMIN_APPLICANT_CAPABILITIES,
  type ApplicantOpsCapabilities,
} from '@/components/applicant-ops/ApplicantOpsDetail'

export { ADMIN_APPLICANT_CAPABILITIES, type ApplicantOpsCapabilities }

interface AdminApplicantDetailProps {
  applicant: Parameters<typeof ApplicantOpsDetail>[0]['applicant']
  matchInsight?: Record<string, unknown> | null
}

export default function AdminApplicantDetail(props: AdminApplicantDetailProps) {
  return <ApplicantOpsDetail {...props} capabilities={ADMIN_APPLICANT_CAPABILITIES} />
}

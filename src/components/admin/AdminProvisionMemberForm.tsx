import ProvisionMemberForm from '@/components/applicant-ops/ProvisionMemberForm'

type AdminProvisionMemberFormProps = {
  packagePriceLabel: string
}

export default function AdminProvisionMemberForm(props: AdminProvisionMemberFormProps) {
  return (
    <ProvisionMemberForm
      {...props}
      apiPath="/api/admin/members/provision"
      applicantDetailPathPrefix="/admin/applicants/"
    />
  )
}

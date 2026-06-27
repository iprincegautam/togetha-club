import { notFound, redirect } from 'next/navigation'
import ProvisionMemberForm from '@/components/applicant-ops/ProvisionMemberForm'
import { ROUTES } from '@/constants/routes'
import { requireSupportSession } from '@/lib/auth/support'
import { hasPermission } from '@/lib/support/permissions'
import { buildMetadata } from '@/lib/metadata'
import { fetchPackagePricePaise, formatPaiseAsPackageInr } from '@/lib/package-pricing'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

export const metadata = buildMetadata(
  'Direct login — Support',
  'Create member portal access for direct leads.'
)

export default async function SupportProvisionMemberPage() {
  const ctx = await requireSupportSession()
  if (!ctx) redirect(ROUTES.supportLogin)
  if (!hasPermission(ctx.permissions, 'applicants.provision_login')) notFound()

  const service = tryCreateServiceRoleClient()
  const packagePricePaise = service ? await fetchPackagePricePaise(service) : null
  const packagePriceLabel = packagePricePaise
    ? formatPaiseAsPackageInr(packagePricePaise)
    : 'the current package price'

  return (
    <div className="admin-page">
      <p className="apply-eyebrow">✦ Support ✦</p>
      <h1 className="admin-title">Direct member login</h1>
      <p className="admin-sub">
        Send portal credentials before payment — member links Razorpay payment after sign-in.
        New leads are auto-assigned to you.
      </p>
      <ProvisionMemberForm
        packagePriceLabel={packagePriceLabel}
        apiPath="/api/support/members/provision"
        applicantDetailPathPrefix="/support/applicants/"
      />
    </div>
  )
}

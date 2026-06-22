import AdminProvisionMemberForm from '@/components/admin/AdminProvisionMemberForm'
import { buildMetadata } from '@/lib/metadata'
import { fetchPackagePricePaise, formatPaiseAsPackageInr } from '@/lib/package-pricing'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

export const metadata = buildMetadata(
  'Provision member login | Admin',
  'Create member portal access for direct leads.'
)

export default async function AdminProvisionMemberPage() {
  const service = tryCreateServiceRoleClient()
  const packagePricePaise = service ? await fetchPackagePricePaise(service) : null
  const packagePriceLabel = packagePricePaise
    ? formatPaiseAsPackageInr(packagePricePaise)
    : 'the current package price'

  return (
    <div className="admin-page">
      <p className="apply-eyebrow">✦ Admin ✦</p>
      <h1 className="admin-title">Direct member login</h1>
      <p className="admin-sub">
        Send portal credentials before payment — member links Razorpay payment after sign-in.
      </p>
      <AdminProvisionMemberForm packagePriceLabel={packagePriceLabel} />
    </div>
  )
}

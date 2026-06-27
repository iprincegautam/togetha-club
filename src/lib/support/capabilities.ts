import type { ApplicantOpsCapabilities } from '@/components/applicant-ops/ApplicantOpsDetail'
import { hasPermission, type SupportPermission } from '@/lib/support/permissions'

export function supportApplicantCapabilities(
  permissions: Set<SupportPermission> | SupportPermission[]
): ApplicantOpsCapabilities {
  return {
    apiBase: '/api/support',
    canEditNotes: hasPermission(permissions, 'applicants.notes'),
    canEditStatus: hasPermission(permissions, 'applicants.status'),
    canResendCredentials: hasPermission(permissions, 'applicants.resend_credentials'),
    canApproveProfile: hasPermission(permissions, 'applicants.approve_profile'),
  }
}

export function supportCanSendBalanceLink(
  permissions: Set<SupportPermission> | SupportPermission[]
): boolean {
  return hasPermission(permissions, 'applicants.send_balance_link')
}

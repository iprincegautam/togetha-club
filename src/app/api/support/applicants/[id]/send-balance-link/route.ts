import { NextResponse } from 'next/server'
import { normalizeApplicantIdOrEmail } from '@/lib/admin-applicant-lookup'
import {
  buildBalanceLinkPreview,
  loadApplicantForBalance,
  sendApplicantBalanceLink,
} from '@/lib/applicant-ops/send-balance-link'
import { assertApplicantInSupportScope } from '@/lib/support/applicant-scope'
import { requireSupportApiAccess } from '@/lib/auth/support'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireSupportApiAccess('applicants.send_balance_link')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: rawId } = await params
  const id = normalizeApplicantIdOrEmail(rawId)

  const scope = await assertApplicantInSupportScope(
    auth.service,
    id,
    auth.staff.view_scope,
    auth.profile.id
  )
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status })
  }

  const loaded = await loadApplicantForBalance(auth.service, id)
  if ('error' in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }

  return NextResponse.json(buildBalanceLinkPreview(loaded))
}

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireSupportApiAccess('applicants.send_balance_link')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: rawId } = await params
  const id = normalizeApplicantIdOrEmail(rawId)

  const scope = await assertApplicantInSupportScope(
    auth.service,
    id,
    auth.staff.view_scope,
    auth.profile.id
  )
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status })
  }

  const result = await sendApplicantBalanceLink(auth.service, id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error, payUrl: result.payUrl }, { status: result.status })
  }

  return NextResponse.json(result)
}

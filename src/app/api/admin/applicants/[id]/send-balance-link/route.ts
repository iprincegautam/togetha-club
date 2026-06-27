import { NextResponse } from 'next/server'
import { normalizeApplicantIdOrEmail } from '@/lib/admin-applicant-lookup'
import {
  buildBalanceLinkPreview,
  loadApplicantForBalance,
  sendApplicantBalanceLink,
} from '@/lib/applicant-ops/send-balance-link'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: rawId } = await params
  const id = normalizeApplicantIdOrEmail(rawId)

  if (id.includes('/')) {
    return NextResponse.json(
      {
        error:
          'Invalid applicant id in URL (contains /). Use /api/admin/applicants/send-balance-link?email=... instead.',
        received: rawId,
      },
      { status: 400 }
    )
  }

  const loaded = await loadApplicantForBalance(auth.service, id)
  if ('error' in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }

  return NextResponse.json(buildBalanceLinkPreview(loaded))
}

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: rawId } = await params
  const id = normalizeApplicantIdOrEmail(rawId)

  if (id.includes('/')) {
    return NextResponse.json({ error: 'Invalid applicant id in URL.' }, { status: 400 })
  }

  const result = await sendApplicantBalanceLink(auth.service, id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error, payUrl: result.payUrl }, { status: result.status })
  }

  return NextResponse.json(result)
}

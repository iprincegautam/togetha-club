import { NextRequest, NextResponse } from 'next/server'
import {
  buildBalanceLinkPreview,
  loadApplicantForBalance,
  sendApplicantBalanceLink,
} from '@/lib/applicant-ops/send-balance-link'
import { requireAdminApiAccess } from '@/lib/auth/admin'

/** Safe lookup: /api/admin/applicants/send-balance-link?email=user@example.com */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const email = request.nextUrl.searchParams.get('email')?.trim()
  const id = request.nextUrl.searchParams.get('id')?.trim()
  const key = email || id

  if (!key) {
    return NextResponse.json(
      {
        error:
          'Pass ?email=member@example.com or ?id=<applicant-uuid>. Do not put email in the URL path.',
        example: '/api/admin/applicants/send-balance-link?email=techhitech11@gmail.com',
      },
      { status: 400 }
    )
  }

  const loaded = await loadApplicantForBalance(auth.service, key)
  if ('error' in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }

  return NextResponse.json(buildBalanceLinkPreview(loaded))
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const email = request.nextUrl.searchParams.get('email')?.trim()
  const id = request.nextUrl.searchParams.get('id')?.trim()
  let key = email || id

  if (!key) {
    try {
      const body = await request.json().catch(() => ({}))
      key = String(body.email ?? body.id ?? '').trim()
    } catch {
      key = ''
    }
  }

  if (!key) {
    return NextResponse.json({ error: 'Pass ?email= or ?id= query param' }, { status: 400 })
  }

  const result = await sendApplicantBalanceLink(auth.service, key)
  if (!result.ok) {
    return NextResponse.json({ error: result.error, payUrl: result.payUrl }, { status: result.status })
  }

  return NextResponse.json(result)
}

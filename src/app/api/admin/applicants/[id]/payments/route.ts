import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { listApplicantPayments, summarizeApplicantPayments } from '@/lib/applicant-payments'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const payments = await listApplicantPayments(auth.service, id)
  const summary = summarizeApplicantPayments(payments)

  return NextResponse.json({ payments, summary })
}

import { NextResponse } from 'next/server'
import { confirmEmailChange, requestEmailChange } from '@/lib/auth/email-change'
import { requireMemberApiAccess } from '@/lib/auth/member'

export async function POST(request: Request) {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const newEmail = String(body.newEmail ?? '').trim()
  if (!newEmail.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (newEmail.toLowerCase() === auth.session.user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'That is already your email.' }, { status: 400 })
  }

  const result = await requestEmailChange(auth.service, {
    userId: auth.session.user.id,
    newEmail,
    portal: 'member',
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const result = await confirmEmailChange(auth.service, {
    userId: auth.session.user.id,
    newEmail: String(body.newEmail ?? ''),
    code: String(body.code ?? ''),
    portal: 'member',
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

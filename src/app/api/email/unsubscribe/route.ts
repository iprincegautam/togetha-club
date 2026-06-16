import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { stopNurtureSequence } from '@/lib/nurture/should-stop'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

function verifyToken(email: string, token: string): boolean {
  const secret = process.env.NURTURE_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev'
  const expected = createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 20)
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  const token = req.nextUrl.searchParams.get('token')?.trim()

  if (!email || !token || !verifyToken(email, token)) {
    return new NextResponse('Invalid unsubscribe link.', { status: 400, headers: { 'Content-Type': 'text/plain' } })
  }

  const supabase = tryCreateServiceRoleClient()
  if (!supabase) {
    return new NextResponse('Service unavailable. Try again later.', { status: 503 })
  }

  await supabase.from('email_unsubscribes').upsert({ email, reason: 'link' })

  const { data: applicant } = await supabase
    .from('applicants')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (applicant?.id) {
    await stopNurtureSequence(supabase, applicant.id, 'unsubscribed')
  }

  return new NextResponse(
    `You're unsubscribed from Togetha.Club follow-up emails.\n\nChanged your mind? Write to hello@togetha.club anytime.`,
    { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  )
}

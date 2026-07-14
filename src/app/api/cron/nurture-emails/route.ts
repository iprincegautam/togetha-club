import { NextRequest, NextResponse } from 'next/server'
import { processDueNurtureEmails } from '@/lib/nurture/send'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Vercel Hobby caps serverless functions at 60s; the processor self-limits
// (CRON_TIME_BUDGET_MS) well under this so it always returns 200.
export const maxDuration = 60

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV === 'development'
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = tryCreateServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  try {
    const result = await processDueNurtureEmails(supabase)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[GET /api/cron/nurture-emails]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

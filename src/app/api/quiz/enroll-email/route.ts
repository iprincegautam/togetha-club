import { NextRequest, NextResponse } from 'next/server'
import { enrollQuizNurture } from '@/lib/nurture/send'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

/** Backup trigger after lead form — idempotent re-enroll + Email 1. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const applicantId = String(body.applicantId ?? '').trim()

    if (!applicantId) {
      return NextResponse.json({ error: 'applicantId required' }, { status: 400 })
    }

    const supabase = tryCreateServiceRoleClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const result = await enrollQuizNurture(supabase, applicantId)
    return NextResponse.json({
      ok: result.ok,
      error: result.error ?? null,
    })
  } catch (err) {
    console.error('[POST /api/quiz/enroll-email]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

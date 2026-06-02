import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { sendWaitlistEmail } from '@/lib/resend'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, gender } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = tryCreateServiceRoleClient()
    if (!supabase) {
      if (isDevelopment()) {
        return NextResponse.json({ success: true, dev: true })
      }
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, alreadyJoined: true })
    }

    const { error } = await supabase.from('waitlist').insert({
      email,
      gender: gender || null,
      batch_slug: 'batch-c',
    })

    if (error) throw error

    await sendWaitlistEmail(email)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/waitlist]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

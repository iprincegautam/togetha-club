import { NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createServerAuthClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

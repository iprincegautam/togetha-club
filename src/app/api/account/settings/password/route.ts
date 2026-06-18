import { NextRequest, NextResponse } from 'next/server'
import { validatePassword } from '@/lib/auth/signup'
import { createServerAuthClient, tryCreateServiceRoleClient } from '@/lib/supabase/server'

/** Clears password_change_required after member sets a personal password. */
export async function PATCH(req: NextRequest) {
  const supabase = await createServerAuthClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const newPassword = String(body.newPassword ?? '')

  if (newPassword) {
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }
  }

  const service = tryCreateServiceRoleClient()
  if (!service) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { error: profileError } = await service
    .from('profiles')
    .update({ password_change_required: false })
    .eq('id', session.user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

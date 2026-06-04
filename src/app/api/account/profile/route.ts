import { NextResponse } from 'next/server'
import { requireMemberApiAccess } from '@/lib/auth/member'

export async function PATCH(request: Request) {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.fullName !== undefined) updates.full_name = body.fullName ? String(body.fullName).trim() : null
  if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null
  if (body.city !== undefined) updates.city = body.city ? String(body.city).trim() : null
  if (body.bio !== undefined) updates.bio = body.bio ? String(body.bio).trim() : null
  if (body.emergencyContact !== undefined) {
    updates.emergency_contact = body.emergencyContact ? String(body.emergencyContact).trim() : null
  }
  if (body.dietaryNotes !== undefined) {
    updates.dietary_notes = body.dietaryNotes ? String(body.dietaryNotes).trim() : null
  }
  if (body.instagramHandle !== undefined) {
    updates.instagram_handle = body.instagramHandle ? String(body.instagramHandle).trim() : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('profiles')
    .update(updates)
    .eq('id', auth.session.user.id)
    .select('*')
    .single()

  if (error) {
    console.error('[PATCH /api/account/profile]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.markKycSubmitted) {
    await auth.service
      .from('applicants')
      .update({ kyc_status: 'submitted' })
      .eq('id', auth.profile!.applicant_id!)
  }

  return NextResponse.json({ profile: data })
}

import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { notifyAdmin } from '@/lib/notifications'

type RouteParams = { params: Promise<{ id: string }> }

function parseIsoDate(value: unknown): string | null {
  if (!value) return null
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()
  const action = String(body.action ?? 'submit')

  const { data: existing } = await auth.service
    .from('content_items')
    .select('id, type, status, batch_slug, batches(name)')
    .eq('id', id)
    .eq('influencer_id', auth.influencer.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const batch = Array.isArray(existing.batches) ? existing.batches[0] : existing.batches
  const batchName = batch?.name ?? existing.batch_slug

  if (action === 'schedule') {
    if (existing.type !== 'pre_trip') {
      return NextResponse.json({ error: 'Only announcement posts can be scheduled' }, { status: 400 })
    }
    const scheduledUploadDate = parseIsoDate(body.scheduledUploadDate)
    if (!scheduledUploadDate) {
      return NextResponse.json({ error: 'Pick a valid date' }, { status: 400 })
    }

    const { error } = await auth.service
      .from('content_items')
      .update({ scheduled_upload_date: scheduledUploadDate })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'clear') {
    const { error } = await auth.service
      .from('content_items')
      .update({
        submitted_url: null,
        submitted_at: null,
        status: 'pending',
        feedback: null,
        reviewed_at: null,
        reviewed_by: null,
        asci_checked: false,
        disclosure_confirmed: false,
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const submittedUrl = String(body.submittedUrl ?? '').trim()
  const asciChecked = Boolean(body.asciChecked)
  const disclosureConfirmed = Boolean(body.disclosureConfirmed)

  if (!submittedUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }
  if (!asciChecked || !disclosureConfirmed) {
    return NextResponse.json({ error: 'Complete the ASCI checklist' }, { status: 400 })
  }

  if (existing.type === 'pre_trip') {
    const scheduledUploadDate = parseIsoDate(body.scheduledUploadDate)
    if (!scheduledUploadDate) {
      return NextResponse.json({ error: 'Pick when you plan to post your announcement video' }, { status: 400 })
    }
    await auth.service
      .from('content_items')
      .update({ scheduled_upload_date: scheduledUploadDate })
      .eq('id', id)
  }

  const { error } = await auth.service
    .from('content_items')
    .update({
      submitted_url: submittedUrl,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
      asci_checked: asciChecked,
      disclosure_confirmed: disclosureConfirmed,
      feedback: null,
      reviewed_at: null,
      reviewed_by: null,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await notifyAdmin(auth.service, {
    type: 'content_submitted',
    title: `${auth.influencer.name} submitted content`,
    body: `${existing.type} for ${batchName} is ready for review.`,
    metadata: { contentId: id, influencerId: auth.influencer.id },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  const { data: existing } = await auth.service
    .from('content_items')
    .select('id, status')
    .eq('id', id)
    .eq('influencer_id', auth.influencer.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await auth.service
    .from('content_items')
    .update({
      submitted_url: null,
      submitted_at: null,
      status: 'pending',
      feedback: null,
      reviewed_at: null,
      reviewed_by: null,
      asci_checked: false,
      disclosure_confirmed: false,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

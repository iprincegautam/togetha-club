import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { notifyAdmin } from '@/lib/notifications'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()
  const submittedUrl = String(body.submittedUrl ?? '').trim()
  const asciChecked = Boolean(body.asciChecked)
  const disclosureConfirmed = Boolean(body.disclosureConfirmed)

  if (!submittedUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }
  if (!asciChecked || !disclosureConfirmed) {
    return NextResponse.json({ error: 'Complete the ASCI checklist' }, { status: 400 })
  }

  const { data: existing } = await auth.service
    .from('content_items')
    .select('id, type, batch_slug, batches(name)')
    .eq('id', id)
    .eq('influencer_id', auth.influencer.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await auth.service
    .from('content_items')
    .update({
      submitted_url: submittedUrl,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
      asci_checked: asciChecked,
      disclosure_confirmed: disclosureConfirmed,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const batch = Array.isArray(existing.batches) ? existing.batches[0] : existing.batches
  await notifyAdmin(auth.service, {
    type: 'content_submitted',
    title: `${auth.influencer.name} submitted content`,
    body: `${existing.type} for ${batch?.name ?? existing.batch_slug} is ready for review.`,
    metadata: { contentId: id, influencerId: auth.influencer.id },
  })

  return NextResponse.json({ success: true })
}

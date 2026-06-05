import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { isValidPan } from '@/lib/partner-portal'
import { notifyAdmin } from '@/lib/notifications'

export async function PATCH(request: Request) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (auth.influencer.pan_verified) {
    return NextResponse.json({ error: 'PAN already verified' }, { status: 400 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  let panNumber = ''
  let panDocUrl: string | null = auth.influencer.pan_doc_url ?? null

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    panNumber = String(form.get('panNumber') ?? '').trim().toUpperCase()
    const file = form.get('panDoc')
    if (file && file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
      }
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `pan/${auth.influencer.id}/${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await auth.service.storage
        .from('partner-docs')
        .upload(path, buffer, { contentType: file.type, upsert: true })
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }
      const { data: urlData } = auth.service.storage.from('partner-docs').getPublicUrl(path)
      panDocUrl = urlData.publicUrl
    }
  } else {
    const body = await request.json()
    panNumber = String(body.panNumber ?? '').trim().toUpperCase()
    if (body.panDocUrl) panDocUrl = String(body.panDocUrl)
  }

  if (!isValidPan(panNumber)) {
    return NextResponse.json({ error: 'Invalid PAN format' }, { status: 400 })
  }

  const { error } = await auth.service
    .from('influencers')
    .update({ pan_number: panNumber, pan_doc_url: panDocUrl })
    .eq('id', auth.influencer.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await notifyAdmin(auth.service, {
    type: 'kyc_submitted',
    title: `${auth.influencer.name} submitted KYC`,
    body: 'PAN details uploaded — verify in Affiliates.',
    metadata: { influencerId: auth.influencer.id },
  })

  return NextResponse.json({ success: true })
}

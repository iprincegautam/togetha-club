import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import {
  isKycDocumentType,
  kycDocumentLabel,
  normalizeKycDocumentNumber,
  validateKycDocument,
} from '@/lib/partner-kyc'
import { notifyAdmin } from '@/lib/notifications'

export async function PATCH(request: Request) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (auth.influencer.pan_verified) {
    return NextResponse.json({ error: 'Identity already verified' }, { status: 400 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  let documentType = auth.influencer.kyc_document_type ?? 'pan'
  let documentNumber = auth.influencer.kyc_document_number ?? auth.influencer.pan_number ?? ''
  let kycDocUrl: string | null = auth.influencer.kyc_doc_url ?? auth.influencer.pan_doc_url ?? null

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const typeRaw = String(form.get('documentType') ?? documentType)
    if (!isKycDocumentType(typeRaw)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }
    documentType = typeRaw
    documentNumber = String(form.get('documentNumber') ?? documentNumber).trim()

    const file = form.get('kycDoc')
    if (file && file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
      }
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `kyc/${documentType}/${auth.influencer.id}/${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await auth.service.storage
        .from('partner-docs')
        .upload(path, buffer, { contentType: file.type, upsert: true })
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }
      const { data: urlData } = auth.service.storage.from('partner-docs').getPublicUrl(path)
      kycDocUrl = urlData.publicUrl
    }
  } else {
    const body = await request.json()
    const typeRaw = String(body.documentType ?? documentType)
    if (!isKycDocumentType(typeRaw)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }
    documentType = typeRaw
    documentNumber = String(body.documentNumber ?? documentNumber).trim()
    if (body.kycDocUrl) kycDocUrl = String(body.kycDocUrl)
  }

  const validationError = validateKycDocument(documentType, documentNumber)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const normalizedNumber = normalizeKycDocumentNumber(documentType, documentNumber)
  const updates: Record<string, string | null> = {
    kyc_document_type: documentType,
    kyc_document_number: normalizedNumber,
    kyc_doc_url: kycDocUrl,
  }
  if (documentType === 'pan') {
    updates.pan_number = normalizedNumber
    updates.pan_doc_url = kycDocUrl
  }

  const { error } = await auth.service.from('influencers').update(updates).eq('id', auth.influencer.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await notifyAdmin(auth.service, {
    type: 'kyc_submitted',
    title: `${auth.influencer.name} submitted KYC`,
    body: `${kycDocumentLabel(documentType)} uploaded — verify in Affiliates.`,
    metadata: { influencerId: auth.influencer.id, documentType },
  })

  return NextResponse.json({ success: true })
}

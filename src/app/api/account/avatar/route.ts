import { NextResponse } from 'next/server'
import { requireMemberApiAccess } from '@/lib/auth/member'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request) {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Use JPG, PNG, or WebP' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${auth.session.user.id}/avatar.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await auth.service.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[avatar upload]', uploadError.message)
    return NextResponse.json(
      {
        error:
          'Photo upload failed. Create a public Supabase Storage bucket named "avatars" and try again.',
      },
      { status: 500 }
    )
  }

  const { data: publicUrl } = auth.service.storage.from('avatars').getPublicUrl(path)

  const { error: profileError } = await auth.service
    .from('profiles')
    .update({ avatar_url: publicUrl.publicUrl })
    .eq('id', auth.session.user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ avatarUrl: publicUrl.publicUrl })
}

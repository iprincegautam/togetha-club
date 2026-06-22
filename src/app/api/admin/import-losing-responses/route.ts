import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type ImportBody = {
  message_id: string
  losing_response: string
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = (await request.json()) as ImportBody | ImportBody[]

  const items = Array.isArray(body) ? body : [body]
  const results: { message_id: string; ok: boolean; error?: string }[] = []

  for (const item of items) {
    if (!item.message_id || item.losing_response == null) {
      results.push({
        message_id: item.message_id ?? '(missing)',
        ok: false,
        error: 'message_id and losing_response are required',
      })
      continue
    }

    const { error } = await auth.service
      .from('dm_annotations')
      .update({ losing_response: item.losing_response })
      .eq('message_id', item.message_id)

    results.push({
      message_id: item.message_id,
      ok: !error,
      error: error?.message,
    })
  }

  const failed = results.filter((r) => !r.ok)
  if (failed.length === results.length) {
    return NextResponse.json({ results }, { status: 400 })
  }

  return NextResponse.json({ results })
}

import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { formatJotformTrainingEntry } from '@/lib/annotations/types'

export async function GET() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await auth.service
    .from('dm_annotations')
    .select('user_message, losing_response, winning_response, category, improvement_delta')
    .eq('annotation_status', 'reviewed')
    .gt('improvement_delta', 3)
    .order('improvement_delta', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []
  const content =
    rows.length === 0
      ? 'No approved annotations with improvement delta above 3.\n'
      : rows.map((row) => `${formatJotformTrainingEntry(row)}\n`).join('\n')

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="togetha_training_data.txt"',
    },
  })
}

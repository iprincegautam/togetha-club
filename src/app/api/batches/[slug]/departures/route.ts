import { NextResponse } from 'next/server'
import { fetchBatchDepartures } from '@/lib/batches'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params

  if (slug !== 'batch-a' && slug !== 'batch-b') {
    return NextResponse.json({ error: 'Invalid batch' }, { status: 400 })
  }

  const supabase = await tryCreateServerSupabaseClient()
  const dates = await fetchBatchDepartures(supabase, slug)

  return NextResponse.json({ dates })
}

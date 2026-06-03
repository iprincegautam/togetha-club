import { readFileSync } from 'fs'
import { resolve } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import pg from 'pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One-time migration runner. POST with header:
 *   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 * Requires SUPABASE_DB_URL (Postgres URI from Supabase → Settings → Database).
 * Remove or disable this route after migration 002 is applied.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    return NextResponse.json(
      {
        error: 'SUPABASE_DB_URL not set',
        hint: 'Add Postgres connection URI to Vercel env (Settings → Database → Connection string).',
      },
      { status: 503 }
    )
  }

  const sqlPath = resolve(
    process.cwd(),
    'supabase/migrations/002_promo_codes_affiliates.sql'
  )
  const sql = readFileSync(sqlPath, 'utf8')

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    await client.query(sql)
    const { rows } = await client.query(
      "SELECT code FROM promo_codes WHERE code = 'SARAH200' LIMIT 1"
    )
    return NextResponse.json({
      ok: true,
      message: 'Migration 002 applied',
      promo: rows[0]?.code ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Migration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await client.end()
  }
}

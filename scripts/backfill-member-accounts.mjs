#!/usr/bin/env node
/**
 * Create/link Supabase Auth accounts for paid applicants missing portal access.
 * Requires SUPABASE_DB_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: node scripts/backfill-member-accounts.mjs [--dry-run]
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dryRun = process.argv.includes('--dry-run')

function loadEnvLocal() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i)
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!process.env[k]) process.env[k] = v
  }
}

loadEnvLocal()

const dbUrl = process.env.SUPABASE_DB_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!dbUrl || !supabaseUrl || !serviceKey) {
  console.error('Need SUPABASE_DB_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const { randomBytes } = await import('crypto')

function tempPassword() {
  return randomBytes(12)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 14)
}

async function findAuthUserIdByEmail(service, email) {
  const normalized = email.trim().toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized)
    if (match) return match.id
    if (data.users.length < 1000) break
  }
  return null
}

const pgClient = new pg.Client({ connectionString: dbUrl })
await pgClient.connect()

const { rows } = await pgClient.query(`
  SELECT a.id, a.email, a.name, a.phone, a.status
  FROM applicants a
  WHERE a.razorpay_payment_id IS NOT NULL
    AND a.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM profiles p WHERE p.applicant_id = a.id
    )
  ORDER BY a.created_at DESC
`)

console.log(`Found ${rows.length} paid applicant(s) without linked portal profile`)
if (rows.length === 0) {
  await pgClient.end()
  process.exit(0)
}

const service = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let created = 0
let linked = 0
let failed = 0

for (const row of rows) {
  const email = row.email.trim().toLowerCase()
  console.log(`\n→ ${row.name ?? '(no name)'} <${email}> [${row.status}]`)

  if (dryRun) {
    console.log('  (dry run — would provision)')
    continue
  }

  try {
    let userId = await findAuthUserIdByEmail(service, email)
    let isNew = false
    const password = tempPassword()

    if (!userId) {
      const { data, error } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: row.name ?? undefined },
      })
      if (error) {
        if (error.message.toLowerCase().includes('already')) {
          userId = await findAuthUserIdByEmail(service, email)
        }
        if (!userId) throw error
      } else {
        userId = data.user.id
        isNew = true
        created++
        console.log(`  ✓ Created auth user — temp password: ${password}`)
      }
    } else {
      linked++
      console.log(`  ✓ Found existing auth user ${userId.slice(0, 8)}…`)
    }

    const { error: profileError } = await service.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: row.name,
        phone: row.phone,
        applicant_id: row.id,
        role: 'member',
        password_change_required: isNew,
      },
      { onConflict: 'id' }
    )

    if (profileError) throw profileError
    console.log('  ✓ Linked profile → applicant')
  } catch (err) {
    failed++
    console.error(`  ✗ Failed: ${err.message}`)
  }
}

await pgClient.end()
console.log(`\nDone — created: ${created}, linked existing auth: ${linked}, failed: ${failed}`)
if (created > 0) {
  console.log('New temp passwords were printed above. Use Admin → Resend credentials to email members.')
}

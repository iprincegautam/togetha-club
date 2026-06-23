#!/usr/bin/env node
/**
 * Health check for KYC-gated balance + approve-profile routes.
 * Expects auth failures (401/403) — not 404/500 — when unauthenticated.
 *
 * Usage: node scripts/check-kyc-endpoints.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? 'http://localhost:3000'
const FAKE_UUID = '00000000-0000-4000-8000-000000000001'

const cases = [
  { name: 'GET /api/account/me', method: 'GET', path: '/api/account/me' },
  { name: 'POST /api/account/balance-order', method: 'POST', path: '/api/account/balance-order' },
  { name: 'POST /api/account/balance-verify', method: 'POST', path: '/api/account/balance-verify', body: {} },
  {
    name: `POST /api/admin/applicants/${FAKE_UUID}/approve-profile`,
    method: 'POST',
    path: `/api/admin/applicants/${FAKE_UUID}/approve-profile`,
  },
  {
    name: `GET /api/admin/applicants/${FAKE_UUID}/send-balance-link`,
    method: 'GET',
    path: `/api/admin/applicants/${FAKE_UUID}/send-balance-link`,
  },
  {
    name: 'GET /api/admin/applicants/send-balance-link',
    method: 'GET',
    path: '/api/admin/applicants/send-balance-link',
  },
  {
    name: 'GET /admin/applicants/[id] page',
    method: 'GET',
    path: `/admin/applicants/${FAKE_UUID}`,
    expectStatuses: [200, 307, 308, 401, 403, 404],
  },
]

function okStatus(status, expectStatuses) {
  const allowed = expectStatuses ?? [401, 403]
  return allowed.includes(status)
}

async function runCase(c) {
  const url = `${BASE.replace(/\/$/, '')}${c.path}`
  const init = {
    method: c.method,
    headers: c.body != null ? { 'Content-Type': 'application/json' } : undefined,
    body: c.body != null ? JSON.stringify(c.body) : undefined,
    redirect: 'manual',
  }

  try {
    const res = await fetch(url, init)
    const text = await res.text()
    let json = null
    try {
      json = JSON.parse(text)
    } catch {
      /* html redirect etc */
    }

    const pass = okStatus(res.status, c.expectStatuses)
    return {
      name: c.name,
      status: res.status,
      pass,
      detail: json?.error ?? (text.length > 80 ? text.slice(0, 80) + '…' : text),
    }
  } catch (err) {
    return { name: c.name, status: 0, pass: false, detail: String(err.message ?? err) }
  }
}

console.log(`Endpoint health check → ${BASE}\n`)

let failed = 0
for (const c of cases) {
  const r = await runCase(c)
  const mark = r.pass ? 'OK' : 'FAIL'
  if (!r.pass) failed++
  console.log(`${mark}  ${r.name}`)
  console.log(`     HTTP ${r.status}${r.detail ? ` — ${r.detail}` : ''}`)
}

console.log('')
if (failed > 0) {
  console.error(`${failed} check(s) failed. Is the dev server running? npm run dev`)
  process.exit(1)
}
console.log('All endpoint routes reachable (auth gates responding as expected).')

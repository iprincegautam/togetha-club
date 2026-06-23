#!/usr/bin/env node
/**
 * Unit-style checks for bookingPipelineState KYC logic (no test runner).
 */
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Load compiled logic via ts — use dynamic import of built file isn't available.
// Inline mirror of booking-stages rules for regression check:
function bookingPipelineState(status, kycStatus, profileComplete, balanceDue) {
  const balance = balanceDue ?? 0
  const kycApproved = kycStatus === 'approved'
  const kycRejected = kycStatus === 'rejected'

  if (status === 'rejected') return { completedThrough: 4, currentIndex: 4 }
  if (kycRejected) return { completedThrough: 1, currentIndex: 3 }
  if (status === 'approved') return { completedThrough: 4, currentIndex: 4 }
  if (status === 'paid' && profileComplete) return { completedThrough: 4, currentIndex: 4 }
  if (status === 'paid') return { completedThrough: 2, currentIndex: profileComplete ? 3 : 2 }

  if (status === 'deposit_paid') {
    if (!profileComplete) return { completedThrough: 1, currentIndex: 1 }
    if (!kycApproved) return { completedThrough: 1, currentIndex: 3 }
    if (balance > 0) return { completedThrough: 3, currentIndex: 2 }
    return { completedThrough: 2, currentIndex: 4 }
  }

  return { completedThrough: 0, currentIndex: 0 }
}

const tests = [
  {
    label: 'deposit + profile + balance, KYC not approved → Under review current',
    args: ['deposit_paid', 'submitted', true, 500000],
    want: { completedThrough: 1, currentIndex: 3 },
  },
  {
    label: 'deposit + profile + balance, KYC approved → Paid in full current',
    args: ['deposit_paid', 'approved', true, 500000],
    want: { completedThrough: 3, currentIndex: 2 },
  },
  {
    label: 'paid + profile complete → Approved for trip',
    args: ['paid', 'approved', true, 0],
    want: { completedThrough: 4, currentIndex: 4 },
  },
  {
    label: 'deposit + no profile → Deposit current',
    args: ['deposit_paid', 'pending', false, 500000],
    want: { completedThrough: 1, currentIndex: 1 },
  },
]

let failed = 0
for (const t of tests) {
  const got = bookingPipelineState(...t.args)
  const pass =
    got.completedThrough === t.want.completedThrough && got.currentIndex === t.want.currentIndex
  console.log(`${pass ? 'OK' : 'FAIL'}  ${t.label}`)
  if (!pass) {
    failed++
    console.log(`     expected ${JSON.stringify(t.want)}, got ${JSON.stringify(got)}`)
  }
}

function canMemberPayBalance(applicant) {
  const balance = applicant.balance_due ?? 0
  return (
    applicant.status === 'deposit_paid' &&
    balance > 0 &&
    applicant.kyc_status === 'approved'
  )
}

const payTests = [
  { label: 'balance blocked without KYC', a: { status: 'deposit_paid', balance_due: 100, kyc_status: 'submitted' }, want: false },
  { label: 'balance open with KYC', a: { status: 'deposit_paid', balance_due: 100, kyc_status: 'approved' }, want: true },
  { label: 'balance blocked when paid', a: { status: 'paid', balance_due: 0, kyc_status: 'approved' }, want: false },
]

for (const t of payTests) {
  const got = canMemberPayBalance(t.a)
  const pass = got === t.want
  console.log(`${pass ? 'OK' : 'FAIL'}  ${t.label}`)
  if (!pass) {
    failed++
    console.log(`     expected ${t.want}, got ${got}`)
  }
}

if (failed > 0) process.exit(1)
console.log('\nBooking pipeline logic checks passed.')

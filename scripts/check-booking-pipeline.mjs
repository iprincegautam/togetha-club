#!/usr/bin/env node
/**
 * Regression checks for booking pipeline step states.
 */

function bookingPipelineState(status, kycStatus, profileComplete, balanceDue) {
  const balance = balanceDue ?? 0
  const kycApproved = kycStatus === 'approved'
  const kycRejected = kycStatus === 'rejected'

  function pipeline(stepStates, currentIndex) {
    let completedThrough = -1
    stepStates.forEach((state, i) => {
      if (state === 'done') completedThrough = i
    })
    return { completedThrough, currentIndex, stepStates }
  }

  if (status === 'rejected') {
    return pipeline(['done', 'done', 'done', 'done', 'current'], 4)
  }
  if (kycRejected) {
    return pipeline(['done', 'done', 'pending', 'current', 'pending'], 3)
  }
  if (status === 'approved' || (status === 'paid' && profileComplete)) {
    return pipeline(['done', 'done', 'done', 'done', 'current'], 4)
  }
  if (status === 'paid') {
    return pipeline(
      ['done', 'done', 'current', profileComplete ? 'done' : 'pending', 'pending'],
      profileComplete ? 3 : 2
    )
  }
  if (status === 'deposit_paid') {
    if (!profileComplete) {
      return pipeline(['done', 'current', 'pending', 'pending', 'pending'], 1)
    }
    if (!kycApproved) {
      return pipeline(['done', 'done', 'pending', 'current', 'pending'], 3)
    }
    if (balance > 0) {
      return pipeline(['done', 'done', 'pending', 'done', 'current'], 4)
    }
    return pipeline(['done', 'done', 'done', 'done', 'current'], 4)
  }
  return pipeline(['current', 'pending', 'pending', 'pending', 'pending'], 0)
}

const tests = [
  {
    label: 'deposit + profile + balance, KYC not approved → Under review current',
    args: ['deposit_paid', 'submitted', true, 500000],
    want: { currentIndex: 3, stepStates: ['done', 'done', 'pending', 'current', 'pending'] },
  },
  {
    label: 'deposit + profile + balance, KYC approved → Approved for trip current, Paid in full open',
    args: ['deposit_paid', 'approved', true, 500000],
    want: { currentIndex: 4, stepStates: ['done', 'done', 'pending', 'done', 'current'] },
  },
  {
    label: 'paid + profile complete → Approved for trip, all prior steps done',
    args: ['paid', 'approved', true, 0],
    want: { currentIndex: 4, stepStates: ['done', 'done', 'done', 'done', 'current'] },
  },
  {
    label: 'deposit + no profile → Deposit current',
    args: ['deposit_paid', 'pending', false, 500000],
    want: { currentIndex: 1, stepStates: ['done', 'current', 'pending', 'pending', 'pending'] },
  },
]

let failed = 0
for (const t of tests) {
  const got = bookingPipelineState(...t.args)
  const pass =
    got.currentIndex === t.want.currentIndex &&
    JSON.stringify(got.stepStates) === JSON.stringify(t.want.stepStates)
  console.log(`${pass ? 'OK' : 'FAIL'}  ${t.label}`)
  if (!pass) {
    failed++
    console.log(`     expected ${JSON.stringify(t.want)}, got ${JSON.stringify(got)}`)
  }
}

if (failed > 0) process.exit(1)
console.log('\nBooking pipeline logic checks passed.')

-- Ledger of every Razorpay payment linked to an applicant (deposit, full, balance).

CREATE TABLE IF NOT EXISTS applicant_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants (id) ON DELETE CASCADE,
  razorpay_payment_id TEXT NOT NULL,
  razorpay_order_id TEXT,
  payment_kind TEXT NOT NULL
    CHECK (payment_kind IN ('deposit', 'full', 'balance', 'claim')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (razorpay_payment_id)
);

CREATE INDEX IF NOT EXISTS applicant_payments_applicant_id_idx
  ON applicant_payments (applicant_id, captured_at DESC);

COMMENT ON TABLE applicant_payments IS
  'One row per captured Razorpay payment ID — deposit, full checkout, balance, or manual claim.';

-- Backfill existing single payment IDs from applicants.
INSERT INTO applicant_payments (
  applicant_id,
  razorpay_payment_id,
  razorpay_order_id,
  payment_kind,
  amount_paise,
  captured_at
)
SELECT
  a.id,
  a.razorpay_payment_id,
  a.razorpay_order_id,
  CASE
    WHEN a.payment_plan = 'deposit' AND COALESCE(a.balance_due, 0) > 0 THEN 'deposit'
    WHEN a.payment_plan = 'deposit' AND COALESCE(a.balance_due, 0) = 0 AND a.status = 'paid' THEN 'full'
    WHEN a.payment_plan = 'full' THEN 'full'
    ELSE 'claim'
  END,
  GREATEST(COALESCE(a.amount_paid, 0), 100),
  COALESCE(a.updated_at, a.created_at, now())
FROM applicants a
WHERE a.razorpay_payment_id IS NOT NULL
  AND COALESCE(a.amount_paid, 0) > 0
ON CONFLICT (razorpay_payment_id) DO NOTHING;

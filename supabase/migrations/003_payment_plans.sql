-- Deposit (30%) vs full payment on checkout

ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_status_check;
ALTER TABLE applicants
  ADD CONSTRAINT applicants_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'deposit_paid'));

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS payment_plan TEXT
    CHECK (payment_plan IN ('deposit', 'full')),
  ADD COLUMN IF NOT EXISTS amount_paid INTEGER,
  ADD COLUMN IF NOT EXISTS balance_due INTEGER;

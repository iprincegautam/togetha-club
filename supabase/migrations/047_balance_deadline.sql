-- 047_balance_deadline.sql
-- Enforce the 48-hour balance payment window after profile approval.
--
-- Policy: after a deposit booking, we verify the profile (24–36h). Once approved,
-- the member has 48 hours to pay the remaining balance or the slot is released and
-- 50% of the booking amount is retained (50% refunded, processed manually by ops).
--
-- This migration is additive and backward compatible:
--   * New columns default to NULL.
--   * Existing approved/deposit_paid rows keep balance_deadline_at = NULL and are
--     therefore GRANDFATHERED — the auto-release cron ignores rows with a NULL
--     deadline so no existing customer is auto-released by surprise. The deadline
--     is only set for profiles approved after this feature ships.

-- Timestamp the moment a profile is approved (anchors the 48h window).
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS profile_approved_at TIMESTAMPTZ;

-- Explicit deadline for the outstanding balance. NULL = not enforced.
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS balance_deadline_at TIMESTAMPTZ;

-- When we sent the automated "pay soon" reminder (dedupe across cron runs).
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS balance_reminder_sent_at TIMESTAMPTZ;

-- When the slot was auto-released for a missed deadline.
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS slot_released_at TIMESTAMPTZ;

-- Allow the new terminal 'expired' status (slot released for non-payment).
ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_status_check;
ALTER TABLE applicants
  ADD CONSTRAINT applicants_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'deposit_paid', 'expired'));

-- Fast lookup for the cron: only rows with an active, outstanding balance deadline.
CREATE INDEX IF NOT EXISTS idx_applicants_balance_deadline
  ON applicants (balance_deadline_at)
  WHERE status = 'deposit_paid' AND balance_due > 0 AND balance_deadline_at IS NOT NULL;

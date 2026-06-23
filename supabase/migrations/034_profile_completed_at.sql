-- Profile completion timestamp (may be missing if migration 027 was not applied).

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN applicants.profile_completed_at IS
  'Set when member completes quiz + batch selection in the portal after payment.';

-- Backfill from existing quiz data where profile is clearly complete.
UPDATE applicants
SET profile_completed_at = COALESCE(updated_at, created_at, NOW())
WHERE profile_completed_at IS NULL
  AND quiz_answers IS NOT NULL
  AND batch_slug IS NOT NULL
  AND gender IS NOT NULL;

-- Members who finished profile but KYC never moved off pending.
UPDATE applicants
SET kyc_status = 'submitted'
WHERE kyc_status = 'pending'
  AND quiz_answers IS NOT NULL
  AND batch_slug IS NOT NULL
  AND gender IS NOT NULL;

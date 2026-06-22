-- Direct / admin-provisioned leads and post-payment profile completion.

ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_lead_source_check;

ALTER TABLE applicants
  ADD CONSTRAINT applicants_lead_source_check
    CHECK (
      lead_source IS NULL
      OR lead_source IN ('quiz', 'quiz_match_lab', 'apply', 'waitlist', 'direct')
    );

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN applicants.profile_completed_at IS
  'Set when member completes quiz + batch selection in the portal after payment.';

-- Persist AI match snapshot when applicant reaches payment step.

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS match_insight JSONB;

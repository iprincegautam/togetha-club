-- Track where quiz leads originated (match lab vs legacy quiz widget).

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS lead_source TEXT
    CHECK (lead_source IS NULL OR lead_source IN ('quiz', 'quiz_match_lab', 'apply', 'waitlist'));

CREATE INDEX IF NOT EXISTS applicants_lead_source_idx ON applicants (lead_source)
  WHERE lead_source IS NOT NULL;

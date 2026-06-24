-- Run once in Supabase SQL Editor (Togetha project: bqroebrlhndftkutsqbu)
-- Creates nurture tables if missing and allows quiz_nurture_v2 six-step sequences.

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  email TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants (id) ON DELETE CASCADE,
  sequence_key TEXT NOT NULL DEFAULT 'quiz_nurture_v1',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'stopped')),
  current_step INTEGER NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_send_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stop_reason TEXT
    CHECK (stop_reason IS NULL OR stop_reason IN ('paid', 'unsubscribed', 'bounced', 'manual', 'error')),
  UNIQUE (applicant_id, sequence_key)
);

CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants (id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences (id) ON DELETE SET NULL,
  step INTEGER NOT NULL,
  resend_message_id TEXT,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX IF NOT EXISTS email_sequences_due_idx
  ON email_sequences (next_send_at)
  WHERE status = 'active' AND next_send_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_sequences_applicant_idx ON email_sequences (applicant_id);
CREATE INDEX IF NOT EXISTS email_sends_applicant_idx ON email_sends (applicant_id, step);

GRANT ALL ON TABLE email_unsubscribes TO service_role;
GRANT ALL ON TABLE email_sequences TO service_role;
GRANT ALL ON TABLE email_sends TO service_role;

GRANT ALL ON TABLE email_unsubscribes TO postgres;
GRANT ALL ON TABLE email_sequences TO postgres;
GRANT ALL ON TABLE email_sends TO postgres;

ALTER TABLE email_sequences
  DROP CONSTRAINT IF EXISTS email_sequences_current_step_check;

ALTER TABLE email_sequences
  ADD CONSTRAINT email_sequences_current_step_check
  CHECK (current_step >= 0 AND current_step <= 6);

ALTER TABLE email_sends
  DROP CONSTRAINT IF EXISTS email_sends_step_check;

ALTER TABLE email_sends
  ADD CONSTRAINT email_sends_step_check
  CHECK (step >= 1 AND step <= 6);

-- Quiz lead nurture email sequences (Resend + Vercel cron)

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
  current_step INTEGER NOT NULL DEFAULT 0 CHECK (current_step >= 0 AND current_step <= 5),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_send_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stop_reason TEXT
    CHECK (stop_reason IS NULL OR stop_reason IN ('paid', 'unsubscribed', 'bounced', 'manual', 'error')),
  UNIQUE (applicant_id, sequence_key)
);

CREATE INDEX IF NOT EXISTS email_sequences_due_idx
  ON email_sequences (next_send_at)
  WHERE status = 'active' AND next_send_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_sequences_applicant_idx ON email_sequences (applicant_id);

CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants (id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences (id) ON DELETE SET NULL,
  step INTEGER NOT NULL CHECK (step >= 1 AND step <= 5),
  resend_message_id TEXT,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX IF NOT EXISTS email_sends_applicant_idx ON email_sends (applicant_id, step);

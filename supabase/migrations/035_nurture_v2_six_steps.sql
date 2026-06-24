-- quiz_nurture_v2: allow 6-step sequences and email sends

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

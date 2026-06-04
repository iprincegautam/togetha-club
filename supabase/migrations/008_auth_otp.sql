-- Email OTP codes for member/partner signup and password reset (sent via Resend)

CREATE TABLE IF NOT EXISTS email_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'reset_password')),
  portal TEXT NOT NULL CHECK (portal IN ('member', 'partner')),
  metadata JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otp_codes_lookup_idx
  ON email_otp_codes (lower(email), purpose, portal, created_at DESC);

-- Service role only — no public RLS policies needed
ALTER TABLE email_otp_codes ENABLE ROW LEVEL SECURITY;

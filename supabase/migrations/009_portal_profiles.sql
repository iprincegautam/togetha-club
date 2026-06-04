-- Portal profiles: member display name, partner payout bank fields, email-change OTP

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS payout_bank_name TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_number TEXT,
  ADD COLUMN IF NOT EXISTS payout_ifsc TEXT;

-- Allow email_change in OTP table
ALTER TABLE email_otp_codes DROP CONSTRAINT IF EXISTS email_otp_codes_purpose_check;
ALTER TABLE email_otp_codes
  ADD CONSTRAINT email_otp_codes_purpose_check
  CHECK (purpose IN ('signup', 'reset_password', 'email_change'));

-- Partners may update their own influencer payout + public fields
DROP POLICY IF EXISTS influencers_partner_update ON influencers;
CREATE POLICY influencers_partner_update ON influencers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.influencer_id = influencers.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.influencer_id = influencers.id
    )
  );

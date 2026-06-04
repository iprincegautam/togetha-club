-- Influencer portal: partner RLS + redemption payout workflow

ALTER TABLE promo_redemptions DROP CONSTRAINT IF EXISTS promo_redemptions_status_check;
ALTER TABLE promo_redemptions
  ADD CONSTRAINT promo_redemptions_status_check
  CHECK (status IN ('pending', 'approved', 'paid_out', 'paid', 'cancelled'));

-- Legacy rows used 'paid' — treat as paid_out
UPDATE promo_redemptions SET status = 'paid_out' WHERE status = 'paid';

ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS payout_upi TEXT,
  ADD COLUMN IF NOT EXISTS payout_notes TEXT;

-- Influencers read their own record
DROP POLICY IF EXISTS influencers_partner_read ON influencers;
CREATE POLICY influencers_partner_read ON influencers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.influencer_id = influencers.id
    )
  );

-- Partners read their promo codes
DROP POLICY IF EXISTS promo_codes_partner_read ON promo_codes;
CREATE POLICY promo_codes_partner_read ON promo_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.influencer_id = promo_codes.influencer_id
    )
  );

-- Partners read their redemptions
DROP POLICY IF EXISTS promo_redemptions_partner_read ON promo_redemptions;
CREATE POLICY promo_redemptions_partner_read ON promo_redemptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.influencer_id = promo_redemptions.influencer_id
    )
  );

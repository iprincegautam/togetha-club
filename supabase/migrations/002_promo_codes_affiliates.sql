-- Promo codes & influencer affiliate tracking

-- ── influencers ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── promo_codes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  influencer_id UUID NOT NULL REFERENCES influencers (id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL
    CHECK (discount_type IN ('percent', 'fixed_inr')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  commission_amount INTEGER NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  grants_priority BOOLEAN NOT NULL DEFAULT false,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  batch_slugs TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_codes_code_idx ON promo_codes (upper(code));

-- ── extend applicants ──────────────────────────────────────────────
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES influencers (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS original_amount INTEGER,
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_amount INTEGER,
  ADD COLUMN IF NOT EXISTS priority_review BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS applicants_promo_code_id_idx ON applicants (promo_code_id);
CREATE INDEX IF NOT EXISTS applicants_influencer_id_idx ON applicants (influencer_id);

-- ── promo_redemptions (commission ledger) ──────────────────────────
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes (id) ON DELETE RESTRICT,
  applicant_id UUID NOT NULL UNIQUE REFERENCES applicants (id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers (id) ON DELETE RESTRICT,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  commission_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid'
    CHECK (status IN ('paid', 'cancelled')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_redemptions_influencer_id_idx ON promo_redemptions (influencer_id);
CREATE INDEX IF NOT EXISTS promo_redemptions_promo_code_id_idx ON promo_redemptions (promo_code_id);

-- ── Row Level Security ─────────────────────────────────────────────
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS influencers_admin_read ON influencers;
CREATE POLICY influencers_admin_read ON influencers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS promo_codes_admin_read ON promo_codes;
CREATE POLICY promo_codes_admin_read ON promo_codes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS promo_redemptions_admin_read ON promo_redemptions;
CREATE POLICY promo_redemptions_admin_read ON promo_redemptions
  FOR SELECT TO authenticated USING (true);

-- ── seed sample influencer + promo code ────────────────────────────
INSERT INTO influencers (id, name, email, status, notes)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Sample Influencer',
  'influencer@example.com',
  'active',
  'Demo affiliate for testing — replace before launch'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO promo_codes (
  code,
  influencer_id,
  discount_type,
  discount_value,
  commission_amount,
  grants_priority,
  max_uses,
  active
)
VALUES (
  'SARAH200',
  'a0000000-0000-4000-8000-000000000001',
  'fixed_inr',
  2000,
  200000,
  true,
  100,
  true
)
ON CONFLICT (code) DO NOTHING;

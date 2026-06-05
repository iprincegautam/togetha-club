-- MOU signing, KYC fields, TDS tracking columns on influencers

CREATE TABLE IF NOT EXISTS mou_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers (id) ON DELETE CASCADE,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  full_name_confirmed TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mou_signatures_influencer_id_idx ON mou_signatures (influencer_id);

ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS mou_signed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mou_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS pan_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS free_trips_used_this_year INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_trips_reset_year INTEGER NOT NULL DEFAULT 2026,
  ADD COLUMN IF NOT EXISTS cash_payouts_this_year NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trip_fmv_this_year NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE influencers DROP CONSTRAINT IF EXISTS influencers_status_check;
ALTER TABLE influencers
  ADD CONSTRAINT influencers_status_check
  CHECK (
    status IN (
      'applied',
      'approved',
      'docs_sent',
      'signed',
      'active',
      'inactive',
      'completed',
      'rejected'
    )
  );

-- Backfill existing active influencers as MOU-unsigned but active
UPDATE influencers SET status = 'active' WHERE status NOT IN (
  'applied', 'approved', 'docs_sent', 'signed', 'active', 'inactive', 'completed', 'rejected'
);

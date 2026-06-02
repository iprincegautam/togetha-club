-- Togetha.Club initial schema
-- Run in Supabase SQL Editor or via: supabase db push

-- ── batches ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'sold_out', 'waitlist', 'coming_soon')),
  spots_taken_m INTEGER NOT NULL DEFAULT 0,
  spots_taken_f INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── applicants ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('m', 'f')),
  batch_slug TEXT REFERENCES batches (slug) ON DELETE SET NULL,
  date_choice TEXT,
  quiz_answers JSONB,
  quiz_score INTEGER,
  compatibility_vector JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applicants_batch_slug_idx ON applicants (batch_slug);
CREATE INDEX IF NOT EXISTS applicants_status_idx ON applicants (status);
CREATE INDEX IF NOT EXISTS applicants_created_at_idx ON applicants (created_at DESC);

-- ── waitlist ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  gender TEXT CHECK (gender IN ('m', 'f')),
  batch_slug TEXT NOT NULL DEFAULT 'batch-c',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── updated_at trigger ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applicants_updated_at ON applicants;
CREATE TRIGGER applicants_updated_at
  BEFORE UPDATE ON applicants
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── seed batches ─────────────────────────────────────────────────────
INSERT INTO batches (slug, name, price, status, spots_taken_m, spots_taken_f)
VALUES
  ('batch-a', 'The Himalayan Love Trail — A', 18999, 'open', 6, 7),
  ('batch-b', 'The Himalayan Love Trail — B', 22999, 'open', 5, 6),
  ('batch-c', 'The Himalayan Love Trail — C', NULL, 'coming_soon', 0, 0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  status = EXCLUDED.status;

-- ── Row Level Security ───────────────────────────────────────────────
-- Server-side API routes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- Anon/authenticated clients are read-only except where noted.

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public can read batch listings
DROP POLICY IF EXISTS batches_public_read ON batches;
CREATE POLICY batches_public_read ON batches
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated admins can read applicants (admin dashboard)
DROP POLICY IF EXISTS applicants_admin_read ON applicants;
CREATE POLICY applicants_admin_read ON applicants
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated admins can read waitlist
DROP POLICY IF EXISTS waitlist_admin_read ON waitlist;
CREATE POLICY waitlist_admin_read ON waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon or authenticated.
-- All writes go through API routes using the service role key.

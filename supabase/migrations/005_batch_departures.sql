-- Admin-managed departure dates and applicant ops fields

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS max_spots_m INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS max_spots_f INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS deposit_percent INTEGER NOT NULL DEFAULT 30
    CHECK (deposit_percent >= 0 AND deposit_percent <= 100);

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS departure_id UUID;

CREATE TABLE IF NOT EXISTS batch_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_slug TEXT NOT NULL REFERENCES batches (slug) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sublabel TEXT,
  departure_date DATE,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'sold_out', 'cancelled')),
  spots_m INTEGER NOT NULL DEFAULT 12 CHECK (spots_m >= 0),
  spots_f INTEGER NOT NULL DEFAULT 12 CHECK (spots_f >= 0),
  spots_taken_m INTEGER NOT NULL DEFAULT 0 CHECK (spots_taken_m >= 0),
  spots_taken_f INTEGER NOT NULL DEFAULT 0 CHECK (spots_taken_f >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE applicants
  DROP CONSTRAINT IF EXISTS applicants_departure_id_fkey;

ALTER TABLE applicants
  ADD CONSTRAINT applicants_departure_id_fkey
  FOREIGN KEY (departure_id) REFERENCES batch_departures (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS batch_departures_batch_slug_idx ON batch_departures (batch_slug);
CREATE INDEX IF NOT EXISTS batch_departures_status_idx ON batch_departures (status);
CREATE UNIQUE INDEX IF NOT EXISTS batch_departures_slug_date_uidx
  ON batch_departures (batch_slug, departure_date)
  WHERE departure_date IS NOT NULL;

DROP TRIGGER IF EXISTS batch_departures_updated_at ON batch_departures;
CREATE TRIGGER batch_departures_updated_at
  BEFORE UPDATE ON batch_departures
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE batch_departures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS batch_departures_public_read ON batch_departures;
CREATE POLICY batch_departures_public_read ON batch_departures
  FOR SELECT
  TO anon, authenticated
  USING (status != 'cancelled');

-- Seed departure dates when table is empty (matches previous hardcoded options)
INSERT INTO batch_departures (batch_slug, label, sublabel, departure_date, return_date, sort_order, status)
SELECT v.batch_slug, v.label, v.sublabel, v.departure_date::date, v.return_date::date, v.sort_order, v.status
FROM (
  VALUES
    ('batch-a', 'Friday, 13 June 2026', 'Returns Wednesday, 18 June · 5N/6D', '2026-06-13', '2026-06-18', 1, 'open'),
    ('batch-a', 'Friday, 27 June 2026', 'Returns Wednesday, 2 July · 5N/6D', '2026-06-27', '2026-07-02', 2, 'open'),
    ('batch-a', 'Friday, 11 July 2026', 'Returns Wednesday, 16 July · 5N/6D', '2026-07-11', '2026-07-16', 3, 'open'),
    ('batch-a', 'Friday, 25 July 2026', 'Returns Wednesday, 30 July · 5N/6D', '2026-07-25', '2026-07-30', 4, 'open'),
    ('batch-b', 'Friday, 27 June 2026', 'Returns Wednesday, 2 July · 5N/6D', '2026-06-27', '2026-07-02', 1, 'open'),
    ('batch-b', 'Friday, 25 July 2026', 'Returns Wednesday, 30 July · 5N/6D', '2026-07-25', '2026-07-30', 2, 'open'),
    ('batch-b', 'Friday, 11 July 2026', 'Returns Wednesday, 16 July · 5N/6D', '2026-07-11', '2026-07-16', 3, 'open')
) AS v(batch_slug, label, sublabel, departure_date, return_date, sort_order, status)
WHERE NOT EXISTS (SELECT 1 FROM batch_departures LIMIT 1);

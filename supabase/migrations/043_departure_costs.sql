-- Per-departure operating costs (hotel, vehicle, other) for gross-profit tracking.
-- Row-based (not fixed columns) so a departure can have multiple vendors per type
-- and new cost types (guide fee, permits, fuel) can be added without schema changes.

CREATE TABLE IF NOT EXISTS departure_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_id UUID NOT NULL REFERENCES batch_departures (id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('hotel', 'vehicle', 'other')),
  description TEXT,
  vendor_name TEXT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  incurred_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS departure_costs_departure_id_idx
  ON departure_costs (departure_id, created_at DESC);

DROP TRIGGER IF EXISTS departure_costs_updated_at ON departure_costs;
CREATE TRIGGER departure_costs_updated_at
  BEFORE UPDATE ON departure_costs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS enabled with NO policies for anon/authenticated — default-deny, same as
-- departure_logistics (041). Only the service-role client used by admin API
-- routes can read/write internal financials.
ALTER TABLE departure_costs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE departure_costs IS
  'Per-departure operating costs (hotel, vehicle, other) in paise. RLS default-deny — service-role access only via admin finance API routes.';
COMMENT ON COLUMN departure_costs.incurred_on IS
  'When the expense actually happened (optional); falls back to created_at for the transactions feed.';

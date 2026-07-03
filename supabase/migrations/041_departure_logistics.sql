-- Per-departure logistics (pickup, vehicle, guide contact) — never exposed to anon/authenticated.
-- One row per batch_departures.id, admin-managed, read only via service-role (member API route).

CREATE TABLE IF NOT EXISTS departure_logistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_id UUID NOT NULL REFERENCES batch_departures (id) ON DELETE CASCADE,
  pickup_location TEXT,
  vehicle_number TEXT,
  guide_name TEXT,
  guide_phone TEXT,
  guide_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (departure_id)
);

CREATE INDEX IF NOT EXISTS departure_logistics_departure_id_idx
  ON departure_logistics (departure_id);

DROP TRIGGER IF EXISTS departure_logistics_updated_at ON departure_logistics;
CREATE TRIGGER departure_logistics_updated_at
  BEFORE UPDATE ON departure_logistics
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS enabled with NO policies for anon/authenticated — default-deny.
-- Only the service-role client (used in admin + member API routes) can read/write this table.
ALTER TABLE departure_logistics ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE departure_logistics IS
  'Per-departure-cohort trip logistics (pickup point, vehicle, guide contact). One row per batch_departures.id. RLS default-deny — never exposed to anon/authenticated; only service-role access via admin/member API routes.';

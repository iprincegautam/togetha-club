-- Complimentary partner trip slots and plus-one registration

CREATE TABLE IF NOT EXISTS partner_trip_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  influencer_id UUID NOT NULL REFERENCES influencers (id) ON DELETE CASCADE,
  batch_slug TEXT NOT NULL REFERENCES batches (slug) ON DELETE CASCADE,
  departure_id UUID REFERENCES batch_departures (id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'complimentary'
    CHECK (type IN ('complimentary', 'self_paid')),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  guest_name TEXT,
  guest_phone TEXT,
  guest_added_at TIMESTAMPTZ,
  fmv_amount NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS partner_trip_slots_influencer_id_idx ON partner_trip_slots (influencer_id);

ALTER TABLE partner_trip_slots ENABLE ROW LEVEL SECURITY;

-- Partner content calendar and admin review queue

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  influencer_id UUID NOT NULL REFERENCES influencers (id) ON DELETE CASCADE,
  batch_slug TEXT NOT NULL REFERENCES batches (slug) ON DELETE CASCADE,
  departure_id UUID REFERENCES batch_departures (id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('pre_trip', 'daily_story', 'post_trip')),
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'overdue')),
  submitted_url TEXT,
  submitted_at TIMESTAMPTZ,
  asci_checked BOOLEAN NOT NULL DEFAULT FALSE,
  disclosure_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS content_items_influencer_id_idx ON content_items (influencer_id);
CREATE INDEX IF NOT EXISTS content_items_status_idx ON content_items (status);
CREATE INDEX IF NOT EXISTS content_items_due_date_idx ON content_items (due_date);

DROP TRIGGER IF EXISTS content_items_updated_at ON content_items;
CREATE TRIGGER content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

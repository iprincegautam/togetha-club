-- Custom Fri→Wed trip dates on partner slots

ALTER TABLE partner_trip_slots
  ADD COLUMN IF NOT EXISTS departure_date DATE,
  ADD COLUMN IF NOT EXISTS return_date DATE,
  ADD COLUMN IF NOT EXISTS booking_mode TEXT NOT NULL DEFAULT 'preset'
    CHECK (booking_mode IN ('preset', 'custom')),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill dates from linked departures where available
UPDATE partner_trip_slots pts
SET
  departure_date = bd.departure_date::date,
  return_date = bd.return_date::date
FROM batch_departures bd
WHERE pts.departure_id = bd.id
  AND pts.departure_date IS NULL
  AND bd.departure_date IS NOT NULL;

-- Grandfather 6-month windows for already-completed trips
UPDATE influencers i
SET
  last_trip_completed_at = COALESCE(i.last_trip_completed_at, sub.completed_at),
  next_trip_eligible_until = COALESCE(
    i.next_trip_eligible_until,
    sub.completed_at + interval '6 months'
  )
FROM (
  SELECT DISTINCT ON (influencer_id)
    influencer_id,
    COALESCE(completed_at, created_at) AS completed_at
  FROM partner_trip_slots
  WHERE status = 'completed'
  ORDER BY influencer_id, COALESCE(completed_at, created_at) DESC
) sub
WHERE i.id = sub.influencer_id;

-- Add reporting/departure/arrival timing to per-departure logistics.
-- Free-text (not TIME type) since these are often ranges ("6:00 - 7:00 AM") not single instants.

ALTER TABLE departure_logistics
  ADD COLUMN IF NOT EXISTS reporting_time TEXT,
  ADD COLUMN IF NOT EXISTS departure_time TEXT,
  ADD COLUMN IF NOT EXISTS arrival_time TEXT;

COMMENT ON COLUMN departure_logistics.reporting_time IS 'When members should show up at the pickup point, e.g. "10:00 PM".';
COMMENT ON COLUMN departure_logistics.departure_time IS 'When the vehicle actually leaves, e.g. "10:30 PM".';
COMMENT ON COLUMN departure_logistics.arrival_time IS 'Expected return/drop-off time, e.g. "Wednesday, 6:00 - 7:00 AM".';

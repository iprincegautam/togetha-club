-- Weekly Friday departures for GenZ (batch-a) and Millennial (batch-b), starting 26 Jun 2026.
-- Site and quiz only show dates within the next 6 weeks (handled in application code).

UPDATE batch_departures
SET status = 'cancelled', updated_at = now()
WHERE batch_slug IN ('batch-a', 'batch-b')
  AND status != 'cancelled';

INSERT INTO batch_departures (batch_slug, label, sublabel, departure_date, return_date, sort_order, status)
SELECT
  b.slug,
  to_char(d.departure_date, 'FMDay, DD FMMonth YYYY'),
  'Returns ' || to_char(d.return_date, 'FMDay, DD FMMonth') || ' · 5N/6D',
  d.departure_date,
  d.return_date,
  d.sort_order,
  'open'
FROM (VALUES ('batch-a'), ('batch-b')) AS b(slug)
CROSS JOIN LATERAL (
  SELECT
    (DATE '2026-06-26' + (n * interval '7 days'))::date AS departure_date,
    (DATE '2026-06-26' + (n * interval '7 days') + interval '5 days')::date AS return_date,
    n + 1 AS sort_order
  FROM generate_series(0, 25) AS n
) d
ON CONFLICT (batch_slug, departure_date) WHERE departure_date IS NOT NULL
DO UPDATE SET
  label = EXCLUDED.label,
  sublabel = EXCLUDED.sublabel,
  return_date = EXCLUDED.return_date,
  sort_order = EXCLUDED.sort_order,
  status = 'open',
  updated_at = now();

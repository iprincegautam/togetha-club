-- Udaipur · Kumbhalgarh destination — GenZ (batch-d) and Millennial (batch-e) editions.

INSERT INTO batches (slug, name, price, status, spots_taken_m, spots_taken_f)
VALUES
  ('batch-d', 'The Udaipur Love Trail — D', 13999, 'open', 0, 0),
  ('batch-e', 'The Udaipur Love Trail — E', 13999, 'open', 0, 0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  status = EXCLUDED.status;

INSERT INTO batch_departures (batch_slug, label, sublabel, departure_date, return_date, sort_order, status)
SELECT
  b.slug,
  to_char(d.departure_date, 'FMDay, DD FMMonth YYYY'),
  'Returns ' || to_char(d.return_date, 'FMDay, DD FMMonth') || ' early morning · 2N/3D',
  d.departure_date,
  d.return_date,
  d.sort_order,
  'open'
FROM (VALUES ('batch-d'), ('batch-e')) AS b(slug)
CROSS JOIN LATERAL (
  SELECT
    (DATE '2026-06-26' + (n * interval '7 days'))::date AS departure_date,
    (DATE '2026-06-26' + (n * interval '7 days') + interval '4 days')::date AS return_date,
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

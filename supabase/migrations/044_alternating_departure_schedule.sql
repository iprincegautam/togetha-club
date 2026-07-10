-- Alternating Friday launch schedule through August 2026.
-- 17 Jul Udaipur → 24 Jul Bir/Himalayan → 31 Jul Udaipur → … → 28 Aug Udaipur.
-- Each destination Friday opens GenZ + Millennial editions.

-- 1) Cancel anything outside the destination's allowed Fridays.
UPDATE batch_departures
SET status = 'cancelled', updated_at = now()
WHERE batch_slug IN ('batch-d', 'batch-e')
  AND (
    departure_date IS NULL
    OR departure_date NOT IN (
      DATE '2026-07-17',
      DATE '2026-07-31',
      DATE '2026-08-14',
      DATE '2026-08-28'
    )
  );

UPDATE batch_departures
SET status = 'cancelled', updated_at = now()
WHERE batch_slug IN ('batch-a', 'batch-b')
  AND (
    departure_date IS NULL
    OR departure_date NOT IN (
      DATE '2026-07-24',
      DATE '2026-08-07',
      DATE '2026-08-21'
    )
  );

-- 2) Upsert Udaipur Fridays (batch-d GenZ, batch-e Millennial) — 2N/3D (+4 days).
INSERT INTO batch_departures (batch_slug, label, sublabel, departure_date, return_date, sort_order, status)
SELECT
  b.slug,
  to_char(d.departure_date, 'FMDay, DD FMMonth YYYY'),
  'Returns ' || to_char((d.departure_date + interval '4 days')::date, 'FMDay, DD FMMonth')
    || ' early morning · 2N/3D',
  d.departure_date,
  (d.departure_date + interval '4 days')::date,
  d.sort_order,
  'open'
FROM (VALUES ('batch-d'), ('batch-e')) AS b(slug)
CROSS JOIN (
  VALUES
    (DATE '2026-07-17', 1),
    (DATE '2026-07-31', 2),
    (DATE '2026-08-14', 3),
    (DATE '2026-08-28', 4)
) AS d(departure_date, sort_order)
ON CONFLICT (batch_slug, departure_date) WHERE departure_date IS NOT NULL
DO UPDATE SET
  label = EXCLUDED.label,
  sublabel = EXCLUDED.sublabel,
  return_date = EXCLUDED.return_date,
  sort_order = EXCLUDED.sort_order,
  status = 'open',
  updated_at = now();

-- 3) Upsert Bir/Himalayan Fridays (batch-a GenZ, batch-b Millennial) — 5N/6D (+5 days).
INSERT INTO batch_departures (batch_slug, label, sublabel, departure_date, return_date, sort_order, status)
SELECT
  b.slug,
  to_char(d.departure_date, 'FMDay, DD FMMonth YYYY'),
  'Returns ' || to_char((d.departure_date + interval '5 days')::date, 'FMDay, DD FMMonth')
    || ' · 5N/6D',
  d.departure_date,
  (d.departure_date + interval '5 days')::date,
  d.sort_order,
  'open'
FROM (VALUES ('batch-a'), ('batch-b')) AS b(slug)
CROSS JOIN (
  VALUES
    (DATE '2026-07-24', 1),
    (DATE '2026-08-07', 2),
    (DATE '2026-08-21', 3)
) AS d(departure_date, sort_order)
ON CONFLICT (batch_slug, departure_date) WHERE departure_date IS NOT NULL
DO UPDATE SET
  label = EXCLUDED.label,
  sublabel = EXCLUDED.sublabel,
  return_date = EXCLUDED.return_date,
  sort_order = EXCLUDED.sort_order,
  status = 'open',
  updated_at = now();

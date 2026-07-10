-- Refresh Udaipur departure sublabels for 2N/3D schedule (batch-d, batch-e).

UPDATE batch_departures
SET
  sublabel = 'Returns ' || to_char((departure_date + interval '4 days')::date, 'FMDay, DD FMMonth') || ' early morning · 2N/3D',
  return_date = (departure_date + interval '4 days')::date,
  updated_at = now()
WHERE batch_slug IN ('batch-d', 'batch-e')
  AND departure_date IS NOT NULL
  AND status != 'cancelled';

-- Public batch names: GenZ / Millennial editions only (no A/B/D/E letter codes).
-- Himalayan list prices are finalized in 046_himalayan_price_9999.sql.

UPDATE batches
SET name = 'Himalayan Love Trail — GenZ Edition'
WHERE slug = 'batch-a';

UPDATE batches
SET name = 'Himalayan Love Trail — Millennial Edition'
WHERE slug = 'batch-b';

UPDATE batches
SET name = 'Udaipur Love Trail — GenZ Edition',
    price = 13999
WHERE slug = 'batch-d';

UPDATE batches
SET name = 'Udaipur Love Trail — Millennial Edition',
    price = 13999
WHERE slug = 'batch-e';

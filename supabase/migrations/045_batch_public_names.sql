-- Public batch names: GenZ / Millennial editions only (no A/B/D/E letter codes).
-- Also restore Himalayan list prices if they drifted.

UPDATE batches
SET name = 'Himalayan Love Trail — GenZ Edition',
    price = 18999
WHERE slug = 'batch-a';

UPDATE batches
SET name = 'Himalayan Love Trail — Millennial Edition',
    price = 22999
WHERE slug = 'batch-b';

UPDATE batches
SET name = 'Udaipur Love Trail — GenZ Edition',
    price = 13999
WHERE slug = 'batch-d';

UPDATE batches
SET name = 'Udaipur Love Trail — Millennial Edition',
    price = 13999
WHERE slug = 'batch-e';

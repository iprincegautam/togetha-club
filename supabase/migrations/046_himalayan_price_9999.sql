-- Himalayan Love Trail (batch-a GenZ + batch-b Millennial): ₹9,999 each
-- Udaipur Love Trail stays ₹13,999 (already set in 040)

UPDATE batches
SET price = 9999
WHERE slug IN ('batch-a', 'batch-b');

UPDATE batches
SET price = 13999
WHERE slug IN ('batch-d', 'batch-e');

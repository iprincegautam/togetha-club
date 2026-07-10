-- Udaipur editions: single trip price at ₹13,999 per person (GenZ + Millennial).

UPDATE batches
SET price = 13999
WHERE slug IN ('batch-d', 'batch-e');

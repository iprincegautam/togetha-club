-- Paid members who finished portal profile should show as approved (slot confirmed).

UPDATE applicants
SET
  status = 'approved',
  kyc_status = CASE
    WHEN kyc_status = 'pending' THEN 'submitted'
    ELSE kyc_status
  END
WHERE status = 'paid'
  AND profile_completed_at IS NOT NULL
  AND batch_slug IS NOT NULL
  AND gender IS NOT NULL
  AND quiz_answers IS NOT NULL;

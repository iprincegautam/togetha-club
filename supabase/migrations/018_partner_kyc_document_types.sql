-- Support PAN, Aadhaar, or driving license for partner identity verification.

ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS kyc_document_type TEXT,
  ADD COLUMN IF NOT EXISTS kyc_document_number TEXT,
  ADD COLUMN IF NOT EXISTS kyc_doc_url TEXT;

ALTER TABLE influencers DROP CONSTRAINT IF EXISTS influencers_kyc_document_type_check;
ALTER TABLE influencers
  ADD CONSTRAINT influencers_kyc_document_type_check
  CHECK (kyc_document_type IS NULL OR kyc_document_type IN ('pan', 'aadhaar', 'driving_license'));

-- Backfill from legacy PAN columns
UPDATE influencers
SET
  kyc_document_type = COALESCE(kyc_document_type, 'pan'),
  kyc_document_number = COALESCE(kyc_document_number, pan_number),
  kyc_doc_url = COALESCE(kyc_doc_url, pan_doc_url)
WHERE pan_number IS NOT NULL OR pan_doc_url IS NOT NULL;

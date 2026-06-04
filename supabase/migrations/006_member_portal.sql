-- Member portal: extended profile fields + member access to own applicant row

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS dietary_notes TEXT,
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_kyc_status_check;
ALTER TABLE applicants
  ADD CONSTRAINT applicants_kyc_status_check
  CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected'));

-- Members can read their linked application
DROP POLICY IF EXISTS applicants_member_read ON applicants;
CREATE POLICY applicants_member_read ON applicants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.applicant_id = applicants.id
    )
  );

-- Members can read their batch departure info via applicant (batch_departures already public read)

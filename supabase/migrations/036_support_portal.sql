-- Support portal: role, permissions, staff settings, applicant assignment

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'support';

CREATE TYPE support_permission AS ENUM (
  'applicants.view',
  'applicants.notes',
  'applicants.status',
  'applicants.provision_login',
  'applicants.resend_credentials',
  'applicants.send_balance_link',
  'applicants.approve_profile',
  'waitlist.view',
  'waitlist.manage',
  'dm.annotate'
);

CREATE TYPE support_view_scope AS ENUM ('assigned_only', 'all');

CREATE TABLE support_permissions (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission support_permission NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, permission)
);

CREATE TABLE support_staff (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  view_scope support_view_scope NOT NULL DEFAULT 'assigned_only',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS assigned_support_id UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_applicants_assigned_support ON applicants(assigned_support_id);

ALTER TABLE support_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_permissions_read_own ON support_permissions
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY support_staff_read_own ON support_staff
  FOR SELECT USING (auth.uid() = profile_id);

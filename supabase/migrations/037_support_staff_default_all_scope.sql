-- Default new support staff to see all applicants (admin can still set assigned_only).

ALTER TABLE support_staff
  ALTER COLUMN view_scope SET DEFAULT 'all';

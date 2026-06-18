-- Track members who should set a personal password after auto-provision on payment.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.password_change_required IS
  'True when account was auto-created on payment with a temporary password; cleared after member sets their own.';

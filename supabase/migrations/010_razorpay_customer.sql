-- Razorpay Customer ID for saved payment methods (member balance pay)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;

CREATE INDEX IF NOT EXISTS profiles_razorpay_customer_idx
  ON profiles (razorpay_customer_id)
  WHERE razorpay_customer_id IS NOT NULL;

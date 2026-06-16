-- Fix applicants marked as paid before Razorpay confirmation.
-- Checkout used to set amount_paid when the order was created, not when payment succeeded.

UPDATE applicants
SET
  amount_paid = 0,
  balance_due = COALESCE(final_amount, balance_due, 0)
WHERE razorpay_payment_id IS NULL
  AND COALESCE(amount_paid, 0) > 0;

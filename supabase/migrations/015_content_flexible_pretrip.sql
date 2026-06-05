-- Flexible pre-trip scheduling + nullable due dates for announcement posts

ALTER TABLE content_items
  ALTER COLUMN due_date DROP NOT NULL;

ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS scheduled_upload_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS content_items_scheduled_upload_date_idx
  ON content_items (scheduled_upload_date);

-- Existing announcement posts should not carry a fixed pre-trip due date.
UPDATE content_items
SET due_date = NULL
WHERE type = 'pre_trip';

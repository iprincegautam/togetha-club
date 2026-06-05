-- Partner portal unlock: announcement approval gates full content + trip booking

ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS portal_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS portal_unlocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_trip_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_trip_eligible_until TIMESTAMPTZ;

-- Grandfather: approved announcement already unlocks the portal
UPDATE influencers i
SET
  portal_unlocked = TRUE,
  portal_unlocked_at = COALESCE(
    (
      SELECT ci.reviewed_at
      FROM content_items ci
      WHERE ci.influencer_id = i.id
        AND ci.type = 'pre_trip'
        AND ci.status = 'approved'
      ORDER BY ci.reviewed_at DESC NULLS LAST
      LIMIT 1
    ),
    now()
  )
WHERE EXISTS (
  SELECT 1
  FROM content_items ci
  WHERE ci.influencer_id = i.id
    AND ci.type = 'pre_trip'
    AND ci.status = 'approved'
);

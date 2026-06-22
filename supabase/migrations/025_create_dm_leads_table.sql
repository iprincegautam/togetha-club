-- DM leads from Instagram classification (Sophie pipeline)

CREATE TABLE IF NOT EXISTS public.dm_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  sender_name TEXT NOT NULL,
  instagram_handle TEXT,

  raw_message TEXT,

  category TEXT CHECK (category IN (
    'general_interest',
    'cold_lead',
    'how_to_join',
    'destination_question',
    'pricing_payment',
    'accommodation',
    'payment_failure',
    'frustrated_user',
    'contact_dropped',
    'other'
  )),
  urgency TEXT CHECK (urgency IN ('high', 'medium', 'low')),
  one_line_summary TEXT,

  sophie_replied BOOLEAN DEFAULT FALSE,
  sophie_reply TEXT,
  escalated_to_human BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,

  team_followed_up BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  converted_to_booking BOOLEAN DEFAULT FALSE,

  dm_received_at TIMESTAMPTZ,
  classified_at TIMESTAMPTZ DEFAULT now(),
  followed_up_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_leads_urgency
  ON public.dm_leads (urgency, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_leads_category
  ON public.dm_leads (category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_leads_conversion
  ON public.dm_leads (converted_to_booking, team_followed_up);

CREATE OR REPLACE VIEW dm_leads_weekly_summary AS
SELECT
  category,
  urgency,
  count(*) AS total,
  count(*) FILTER (WHERE team_followed_up = TRUE) AS followed_up,
  count(*) FILTER (WHERE converted_to_booking = TRUE) AS converted,
  count(*) FILTER (WHERE escalated_to_human = TRUE) AS escalated,
  date_trunc('week', created_at) AS week
FROM public.dm_leads
GROUP BY category, urgency, date_trunc('week', created_at)
ORDER BY week DESC, total DESC;

CREATE OR REPLACE VIEW high_urgency_leads AS
SELECT
  sender_name,
  instagram_handle,
  category,
  one_line_summary,
  sophie_replied,
  team_followed_up,
  converted_to_booking,
  dm_received_at
FROM public.dm_leads
WHERE urgency = 'high'
  AND team_followed_up = FALSE
  AND converted_to_booking = FALSE
ORDER BY dm_received_at ASC;

ALTER TABLE public.dm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read leads"
  ON public.dm_leads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert leads"
  ON public.dm_leads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update leads"
  ON public.dm_leads FOR UPDATE
  USING (auth.role() = 'authenticated');

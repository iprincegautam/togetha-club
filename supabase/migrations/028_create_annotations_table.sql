-- Instagram DM annotation tool for agent training

CREATE SEQUENCE IF NOT EXISTS public.dm_annotations_message_id_seq START 1;

CREATE TABLE IF NOT EXISTS public.dm_annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL DEFAULT '',

  user_message TEXT NOT NULL,
  category TEXT CHECK (category IS NULL OR category IN (
    'general_interest',
    'pricing_payment',
    'how_to_join',
    'destination_question',
    'accommodation',
    'payment_failure',
    'frustrated_user',
    'cold_lead'
  )),
  urgency TEXT CHECK (urgency IS NULL OR urgency IN ('high', 'medium', 'low')),

  losing_response TEXT,
  failure_reason TEXT CHECK (failure_reason IS NULL OR failure_reason IN (
    'wrong_category',
    'ignored_question',
    'too_long',
    'too_vague',
    'made_up_info',
    'wrong_followup',
    'generic_reply'
  )),
  winning_response TEXT,

  tone_score_losing INTEGER CHECK (tone_score_losing IS NULL OR tone_score_losing BETWEEN 1 AND 5),
  conversion_score_winning INTEGER CHECK (conversion_score_winning IS NULL OR conversion_score_winning BETWEEN 1 AND 5),

  annotator_notes TEXT,
  is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
  annotation_status TEXT DEFAULT 'draft' NOT NULL CHECK (annotation_status IN ('draft', 'submitted', 'reviewed')),
  annotator_name TEXT,
  rejection_reason TEXT,

  judge_score_losing NUMERIC,
  judge_score_winning NUMERIC,
  improvement_delta NUMERIC,
  judge_verdict_losing TEXT,
  judge_verdict_winning TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.generate_dm_annotation_message_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.message_id IS NULL OR NEW.message_id = '' THEN
    NEW.message_id := 'ANN-' || LPAD(nextval('public.dm_annotations_message_id_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dm_annotations_message_id ON public.dm_annotations;
CREATE TRIGGER trg_dm_annotations_message_id
  BEFORE INSERT ON public.dm_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_dm_annotation_message_id();

CREATE INDEX IF NOT EXISTS idx_dm_annotations_status
  ON public.dm_annotations (annotation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_annotations_category
  ON public.dm_annotations (category);

CREATE INDEX IF NOT EXISTS idx_dm_annotations_improvement
  ON public.dm_annotations (improvement_delta DESC NULLS LAST);

CREATE OR REPLACE VIEW public.annotation_summary AS
SELECT
  category,
  count(*) AS annotation_count,
  avg(judge_score_losing) AS avg_judge_score_losing,
  avg(judge_score_winning) AS avg_judge_score_winning,
  avg(improvement_delta) AS avg_improvement_delta
FROM public.dm_annotations
WHERE category IS NOT NULL
GROUP BY category
ORDER BY avg(improvement_delta) DESC NULLS LAST;

ALTER TABLE public.dm_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on dm_annotations"
  ON public.dm_annotations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated admins can read dm_annotations"
  ON public.dm_annotations
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can write dm_annotations"
  ON public.dm_annotations
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

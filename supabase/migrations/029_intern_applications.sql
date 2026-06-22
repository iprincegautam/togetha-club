-- Founding team internship applications (Summer 2026)

CREATE TABLE IF NOT EXISTS public.intern_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  college TEXT NOT NULL,
  course TEXT,
  year_of_study TEXT NOT NULL CHECK (year_of_study IN ('2nd', '3rd')),
  track TEXT NOT NULL CHECK (track IN ('visual-architect', 'motion-storyteller', 'member-experience')),

  portfolio_url TEXT NOT NULL,
  why_togetha TEXT,
  resume_storage_path TEXT,

  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN (
    'applied',
    'assignment_sent',
    'reviewed',
    'shortlisted',
    'rejected'
  )),
  assignment_sent_at TIMESTAMPTZ,
  notes TEXT,

  CONSTRAINT intern_applications_email_track_unique UNIQUE (email, track)
);

CREATE INDEX IF NOT EXISTS intern_applications_track_idx ON public.intern_applications (track);
CREATE INDEX IF NOT EXISTS intern_applications_status_idx ON public.intern_applications (status);
CREATE INDEX IF NOT EXISTS intern_applications_created_at_idx ON public.intern_applications (created_at DESC);

ALTER TABLE public.intern_applications ENABLE ROW LEVEL SECURITY;

-- No public policies: service role only (same pattern as admin-only tables)

COMMENT ON TABLE public.intern_applications IS 'Founding team summer internship applications — service role access only';

-- Storage bucket for resumes (create via Supabase dashboard or API):
-- Bucket name: intern-resumes (private)
-- Allowed MIME: application/pdf
-- Max file size: 5MB

-- Add voice-architect founding role to intern applications

ALTER TABLE public.intern_applications DROP CONSTRAINT IF EXISTS intern_applications_track_check;

ALTER TABLE public.intern_applications
  ADD CONSTRAINT intern_applications_track_check
  CHECK (track IN (
    'visual-architect',
    'motion-storyteller',
    'member-experience',
    'voice-architect'
  ));

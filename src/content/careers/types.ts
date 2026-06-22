export const INTERN_TRACK_SLUGS = [
  'visual-architect',
  'motion-storyteller',
  'member-experience',
  'voice-architect',
] as const

export type InternTrackSlug = (typeof INTERN_TRACK_SLUGS)[number]

export type InternYearOfStudy = '2nd' | '3rd'

export type InternApplicationStatus =
  | 'applied'
  | 'assignment_sent'
  | 'reviewed'
  | 'shortlisted'
  | 'rejected'

export type CareersRole = {
  slug: InternTrackSlug
  glyph: string
  roleNumber: string
  categoryLabel: string
  title: string
  tagline: string
  whatThisIs: string
  whatYouWillOwn: string[]
  whoWeLookingFor: string[]
  toolsLabel: string
  toolTags: string[]
  teamCollaboration?: { glyph: string; title: string; description: string }[]
}

export type WrittenQuestion = {
  id: string
  prompt: string
}

export type TakeHomePart = {
  title: string
  duration: string
  instructions: string
}

export type TakeHomeAssignment = {
  timeLimitHours: number
  deliverable: string
  parts: TakeHomePart[]
  rubric: { criterion: string; weight: number }[]
}

/** @deprecated use CareersRole */
export type InternTrack = CareersRole & {
  summary: string
  idealFor: string
  youWillOwn: string[]
  youWillNot: string[]
  idealProfile: string[]
  notAFitIf: string[]
}

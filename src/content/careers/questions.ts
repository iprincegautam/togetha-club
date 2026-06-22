import type { InternTrackSlug, WrittenQuestion } from '@/content/careers/types'

export const UNIVERSAL_WRITTEN_QUESTIONS: WrittenQuestion[] = [
  {
    id: 'q1',
    prompt:
      'Your work so far — Tell us about a project or campaign you owned from start to finish. What was the brief (or lack of one)? What did you actually do? What was the result, and what would you do differently?',
  },
  {
    id: 'q2',
    prompt:
      'Working with ambiguity — Describe a time you had to start on something without a clear brief or defined success metric. How did you decide where to begin? What happened?',
  },
  {
    id: 'q3',
    prompt:
      'AI in your workflow — Walk us through how you actually use AI tools in your day-to-day work. Which tools, for what tasks, and what does that look like in practice? Be specific about what you have done.',
  },
  {
    id: 'q4',
    prompt:
      'Getting things done — Tell us about a time you had to get something across the finish line while depending on people you did not manage (freelancer, agency, teammate, client). What did coordination look like? What would you do differently?',
  },
  {
    id: 'q5',
    prompt:
      'Growth curiosity — What is a growth strategy, campaign, or experiment from any company that caught your attention recently? Why did it work (or not work)?',
  },
  {
    id: 'q6',
    prompt:
      'Why Togetha, why now — Why Togetha and this role? We are a small founding team with high trust — tell us what draws you to that kind of environment.',
  },
]

export const TRACK_SPECIFIC_QUESTIONS: Record<InternTrackSlug, WrittenQuestion> = {
  'visual-architect': {
    id: 'q7',
    prompt:
      'Visual taste — Share a link to work you are proud of and one brand (not travel) whose visual identity you admire. What specifically would you borrow — and what would you never copy for Togetha?',
  },
  'motion-storyteller': {
    id: 'q7',
    prompt:
      'Your best film — Share a Reel or Short you made (link). What was the hook, what did you optimize for, and what would you change if you edited it again?',
  },
  'member-experience': {
    id: 'q7',
    prompt:
      'Member empathy — A solo traveler DMs: "Is this a dating app? I am nervous to come alone." Write your reply (under 150 words) — warm, clear, no invented pricing.',
  },
  'voice-architect': {
    id: 'q7',
    prompt:
      'Your voice — Share one piece of brand copy or social writing you are proud of (link). What makes it work, and what would you never write for Togetha?',
  },
}

export function getWrittenQuestionsForTrack(track: InternTrackSlug): WrittenQuestion[] {
  return [...UNIVERSAL_WRITTEN_QUESTIONS, TRACK_SPECIFIC_QUESTIONS[track]]
}

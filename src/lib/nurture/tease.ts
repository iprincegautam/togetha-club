import { QUIZ_QUESTIONS } from '@/constants/quiz'
import type { QuizAnswers } from '@/types/quiz'
import type { TextAnswerState } from '@/lib/nurture/types'

const METAPHOR_QUESTION_ID = 7
const MOUNTAINS_QUESTION_ID = 10

const FULL_MIN_CHARS = 25
const PARTIAL_MIN_CHARS = 1

export function classifyTextAnswer(value: unknown): { state: TextAnswerState; raw: string } {
  if (typeof value !== 'string') return { state: 'skipped', raw: '' }
  const raw = value.trim()
  if (raw.length < PARTIAL_MIN_CHARS) return { state: 'skipped', raw: '' }
  if (raw.length >= FULL_MIN_CHARS) return { state: 'full', raw }
  return { state: 'partial', raw }
}

/** Short teaser — never the full answer in email copy. */
export function teaseFromText(raw: string, maxWords = 9): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim()
  const words = cleaned.split(' ')
  if (words.length <= maxWords) return cleaned
  return `${words.slice(0, maxWords).join(' ')}…`
}

export function readMetaphorAnswer(answers: QuizAnswers) {
  return classifyTextAnswer(answers[METAPHOR_QUESTION_ID])
}

export function readMountainsAnswer(answers: QuizAnswers) {
  return classifyTextAnswer(answers[MOUNTAINS_QUESTION_ID])
}

function optLabel(answers: QuizAnswers, id: number): string | null {
  const q = QUIZ_QUESTIONS.find((item) => item.id === id)
  const raw = answers[id]
  if (!q?.opts || typeof raw !== 'number') return null
  return q.opts[raw] ?? null
}

export function fallbackPersonalityLine(answers: QuizAnswers): string {
  const friday = optLabel(answers, 1)
  const want = optLabel(answers, 6)
  const bonfire = optLabel(answers, 8)

  if (want?.includes('home')) {
    return 'Your answers point to someone who values warmth and ease — the kind of person who shows up fully when the setting is right.'
  }
  if (bonfire?.includes('one-on-one')) {
    return 'Your answers suggest you come alive in real conversation — not small talk, but the kind that runs past midnight.'
  }
  if (friday?.includes('bonfire')) {
    return 'Your answers read like someone who wants the group energy without the performance — present, curious, not trying too hard.'
  }
  return 'Your quiz still built a clear compatibility profile — even without the creative answers, we know where you fit on the batch.'
}

export function buildMetaphorEmailBlock(
  state: TextAnswerState,
  raw: string,
  peerArchetype: string
): { opener: string; body: string } {
  switch (state) {
    case 'full':
      return {
        opener: 'You left us a metaphor — and we read every word.',
        body: `You described yourself in a way that stuck with us — something like "${teaseFromText(raw)}". We can't show you who on your trip matches that energy until you take the next step.`,
      }
    case 'partial':
      return {
        opener: 'You started to describe yourself — we saved what you wrote.',
        body: `You began with "${raw}" — even a few words tell us more than most profiles. Someone already on your departure week answered in a similar spirit. Reserve to see the overlap.`,
      }
    default:
      return {
        opener: 'Your profile is in — even without the metaphor answer.',
        body: `You skipped the creative metaphor, but your other answers still place you near ${peerArchetype} energy on the batch. Someone on your week likely thinks the same way — you'll only see who after you reserve.`,
      }
  }
}

export function buildMountainsEmailBlock(
  state: TextAnswerState,
  raw: string,
  answers: QuizAnswers
): { opener: string; body: string } {
  switch (state) {
    case 'full':
      return {
        opener: 'That line you wrote about the mountains — we weighted it heavily.',
        body: `You wrote something like "${teaseFromText(raw)}" — the kind of answer we don't forget. At least one person on your departure pool aligns with that energy. You're one step away from unlocking who.`,
      }
    case 'partial':
      return {
        opener: 'You gave the mountains a hint — we caught it.',
        body: `You wrote "${raw}" — short, but honest. That's the kind of signal we use when placing you near the right people on night three. Reserve to unlock your batch preview.`,
      }
    default:
      return {
        opener: 'The mountains still have something on you.',
        body: `${fallbackPersonalityLine(answers)} Reserve your slot to unlock who's on your batch — we won't show names or faces until you do.`,
      }
  }
}

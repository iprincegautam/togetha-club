import type { InternTrackSlug, TakeHomeAssignment } from '@/content/careers/types'

export const TAKE_HOME_ASSIGNMENTS: Record<InternTrackSlug, TakeHomeAssignment> = {
  'visual-architect': {
    timeLimitHours: 3,
    deliverable: 'PDF or Figma link + portfolio',
    parts: [
      {
        title: 'Part A — Visual system (90 min)',
        duration: '90 min',
        instructions:
          'Design a 3-slide Instagram carousel for Batch A (GenZ, 18–25) announcing a Friday Himalayan departure. Include slide visuals, caption, and CTA. Must feel cinematic and romantic — not a travel agency, not a dating app.',
      },
      {
        title: 'Part B — AI imagery (60 min)',
        duration: '60 min',
        instructions:
          'Generate 2 campaign images using any AI tool (Midjourney, Flux, Ideogram, etc.) for the line: "Dating apps gave you matches. We give you memories." Include prompts used and why you chose each image.',
      },
      {
        title: 'Part C — Influencer outreach (30 min)',
        duration: '30 min',
        instructions:
          'Pick 3 real Instagram creators (10K–100K) who could fit Togetha. For each: why they fit, one risk, and a DM outreach draft (under 100 words).',
      },
    ],
    rubric: [
      { criterion: 'Aesthetic point of view — unmistakably Togetha', weight: 30 },
      { criterion: 'Visual craft & readability', weight: 25 },
      { criterion: 'AI imagery quality & prompt thinking', weight: 25 },
      { criterion: 'Influencer judgment & outreach tone', weight: 20 },
    ],
  },
  'motion-storyteller': {
    timeLimitHours: 3,
    deliverable: 'MP4 via Google Drive + 1-page rationale PDF',
    parts: [
      {
        title: 'Part A — Reel edit (90 min)',
        duration: '90 min',
        instructions:
          'Edit a 30-second Reel using Himalayan/travel B-roll (your own or licensed). Hook in first 1.5 sec. Cinematic, emotional — end with CTA "DM TRAIL". Export 9:16.',
      },
      {
        title: 'Part B — Hook library (45 min)',
        duration: '45 min',
        instructions:
          'Write 10 opening hooks for: "Dating apps gave you matches. We give you memories." Tag each Batch A (GenZ) or Batch B (Millennial) energy.',
      },
      {
        title: 'Part C — Creative critique (45 min)',
        duration: '45 min',
        instructions:
          'Watch any Reel from @togetha.club (or a competitor you admire). What works, what does not, one specific edit you would change — frame by frame if helpful.',
      },
    ],
    rubric: [
      { criterion: 'Story & hook strength', weight: 30 },
      { criterion: 'Cinematic / platform-native feel', weight: 25 },
      { criterion: 'CTA clarity', weight: 20 },
      { criterion: 'Rationale & taste', weight: 25 },
    ],
  },
  'member-experience': {
    timeLimitHours: 3,
    deliverable: 'Google Doc or PDF',
    parts: [
      {
        title: 'Part A — Member replies (60 min)',
        duration: '60 min',
        instructions:
          'Write warm replies (under 150 words each) for: (1) "Is this safe for solo girls?" (2) "How much does it cost?" — route to quiz, never invent pricing. (3) "Is this like a dating app?"',
      },
      {
        title: 'Part B — Knowledge base (45 min)',
        duration: '45 min',
        instructions:
          'Draft 5 FAQ entries for a member help centre based on togetha.club — accurate facts only (batches, 12+12, quiz flow, slot booking). Clear, peer tone.',
      },
      {
        title: 'Part C — Product intelligence (45 min)',
        duration: '45 min',
        instructions:
          'Imagine you handled 20 member conversations this week. Write a 1-page weekly report template: top questions, confusion points, feature suggestions, one quote that stuck with you.',
      },
    ],
    rubric: [
      { criterion: 'Warmth & clarity', weight: 30 },
      { criterion: 'Accuracy (no made-up policies/pricing)', weight: 30 },
      { criterion: 'Systems thinking in KB + report', weight: 25 },
      { criterion: 'English + Hindi comfort (if applicable)', weight: 15 },
    ],
  },
  'voice-architect': {
    timeLimitHours: 3,
    deliverable: 'Google Doc or PDF',
    parts: [
      {
        title: 'Part A — Website copy (60 min)',
        duration: '60 min',
        instructions:
          'Write hero headline + subhead + primary CTA for the Togetha homepage. Then write a 3-sentence batch description for Batch A (GenZ, 18–25). Romantic, direct, cinematic — never cheesy, never travel-agency tone.',
      },
      {
        title: 'Part B — Instagram carousel (60 min)',
        duration: '60 min',
        instructions:
          'Write copy for a 3-slide carousel announcing a Friday Himalayan departure: slide headlines, body copy per slide, caption, and CTA. Include one story text variant under 100 characters.',
      },
      {
        title: 'Part C — Reel script (60 min)',
        duration: '60 min',
        instructions:
          'Script a 45-second Reel for the line: "Dating apps gave you matches. We give you memories." Include hook (first 3 sec), on-screen text beats, narration, and closing CTA. Tag Batch A or B energy.',
      },
    ],
    rubric: [
      { criterion: 'Voice — unmistakably Togetha (romantic, direct, cinematic)', weight: 35 },
      { criterion: 'Platform-native craft (hooks, CTAs, microcopy)', weight: 25 },
      { criterion: 'Gen Z / Millennial tone control', weight: 20 },
      { criterion: 'Speed & clarity of rationale', weight: 20 },
    ],
  },
}

/** @deprecated member-experience uses member-focused scenarios */
export const SAMPLE_LOSING_DM_REPLIES = [
  {
    userMessage: 'How much is the trip?',
    losingReply:
      'Hey! Our Himalayan Love Trail is an amazing 6-day experience with Manali, Kasol, Sissu, meals, transport, bonfire nights, and 12 boys + 12 girls. Take the quiz on our website when you are ready!',
  },
  {
    userMessage: 'Is this safe for solo girls?',
    losingReply: 'Totally safe! We verify everyone. DM us for more info 😊',
  },
  {
    userMessage: 'Is this like a dating app?',
    losingReply: 'No we are a travel company! Book on togetha.club',
  },
  {
    userMessage: 'hey',
    losingReply:
      'Hello! Welcome to Togetha.Club — India\'s first matchmaking travel club. We run curated batches every Friday for verified singles. Would you like to know about pricing, destinations, or how to join?',
  },
  {
    userMessage: 'Can I come alone?',
    losingReply:
      'Yes solo travelers welcome! Pay Rs 3000 to reserve or full Rs 9999 on checkout.',
  },
]

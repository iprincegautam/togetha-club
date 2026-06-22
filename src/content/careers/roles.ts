import { INTERN_TRACK_SLUGS, type CareersRole, type InternTrackSlug } from '@/content/careers/types'
import { GLYPH } from '@/constants/brand-glyphs'

export const CAREERS_ROLES: Record<InternTrackSlug, CareersRole> = {
  'visual-architect': {
    slug: 'visual-architect',
    glyph: '✦',
    roleNumber: '01',
    categoryLabel: 'Role 01 · Visual × Brand',
    title: 'Founding Visual Architect',
    tagline: "You don't make posts. You make people stop scrolling and feel something.",
    whatThisIs:
      "The first visual hire at a brand that lives on Instagram, bleeds Himalayan aesthetics, and speaks to single 20-somethings looking for something real. You'll own every pixel we put into the world — from social posts to our website to pitch decks. You're not executing a brand. You're building one.",
    whatYouWillOwn: [
      'Design the full visual language of Togetha — color, type, texture, mood — and hold it across every surface',
      'Create Instagram posts, Reels covers, carousels, Stories, and LinkedIn graphics every week',
      'Design and update the website — landing pages, batch pages, quiz flows',
      'Generate AI imagery for campaigns using Midjourney, Ideogram, Flux, or Recraft',
      'Build pitch decks, investor one-pagers, and partner decks in Figma',
      'Collaborate with the motion team on Reel covers, thumbnail treatments, and motion briefs',
      'Ensure everything we ship feels cinematic, romantic, and unmistakably Togetha',
    ],
    whoWeLookingFor: [
      'A portfolio with at least one project that has a real aesthetic point of view — not just clean layouts',
      'Fluent in Figma, Adobe Suite, or Canva Pro at production speed',
      "Actively uses AI generative image tools — you've shipped real work with them, not just played around",
      "Deep feel for Gen Z and Millennial aesthetics — you've studied Hinge, BeReal, Locket, and travel brands that actually look good",
      'Moves fast. Shipping a post in 2 hours when needed is a feature, not a stress',
      'Bonus: basic motion, Webflow, or HTML/CSS skills',
    ],
    toolsLabel: 'AI tools you should know',
    toolTags: [
      'Midjourney / Flux',
      'Ideogram / Recraft',
      'Adobe Firefly',
      'Figma AI',
      'Canva AI',
      'ChatGPT for briefs',
    ],
  },
  'motion-storyteller': {
    slug: 'motion-storyteller',
    glyph: '◈',
    roleNumber: '02',
    categoryLabel: 'Role 02 · Video × Motion',
    title: 'Founding Motion Storyteller',
    tagline:
      'The 60-second video that makes someone book a trip without thinking. You make that.',
    whatThisIs:
      "Think the kind of Reels that feel cinematic and make you want to be there. Think YC launch videos. Think Hinge's brand films. You'll concept, script, cut, and deliver the video content that makes Togetha feel real to someone who's never been on a trip with us. This is not a video editor role. It's a storytelling role.",
    whatYouWillOwn: [
      'Concept and produce launch videos, explainer films, and batch reveal content end-to-end',
      'Cut social-first Reels, YouTube Shorts, and LinkedIn clips optimised for watch time and emotion',
      'Build motion graphics that turn "AI matching" and "vibe compatibility" into something people actually feel',
      'Use Kling, Runway, Veo, ElevenLabs, and CapCut AI to generate and enhance footage where needed',
      'Manage the full post-production pipeline: storyboard → edit → color → audio → delivery',
      "Brief and direct UGC creators and influencers on how to shoot content for Togetha's look",
      'Maintain a living library of b-roll, transitions, and templates the brand reuses consistently',
    ],
    whoWeLookingFor: [
      'Portfolio with at least one video that tells a story — not just showcases transitions',
      'Strong in Premiere Pro, After Effects, or DaVinci Resolve — production speed, not student pace',
      'Motion graphics fluency: animated type, kinetic sequences, mood-driven edits',
      'Has actually shipped something using AI video generation tools — Kling, Runway, or Veo',
      'Understands narrative arc, pacing, and hook structure for short-form video',
      'Bonus: drone footage editing, colour grading for outdoors/mountains, ElevenLabs voice workflows',
    ],
    toolsLabel: 'AI tools you should know',
    toolTags: [
      'Runway / Kling',
      'Veo 3',
      'ElevenLabs',
      'CapCut AI',
      'After Effects',
      'DaVinci Resolve',
    ],
  },
  'member-experience': {
    slug: 'member-experience',
    glyph: '♡',
    roleNumber: '03',
    categoryLabel: 'Role 03 · Member Experience',
    title: 'Founding Member Experience Lead',
    tagline:
      "You're the only human our members ever talk to before they get on that bus. That's everything.",
    whatThisIs:
      "Our platform is automated. Bookings, payments, quizzes — all running. But real people going on a matchmaking trip have real feelings, and some of them will have questions or nerves or last-minute panics. You're the warm, fast, human voice they reach. More importantly: everything you hear from them makes us better. You're our product intelligence loop.",
    whatYouWillOwn: [
      "Be available within 5 minutes on chat and call for any member query that automation doesn't resolve",
      'Handle pre-trip questions, onboarding doubts, payment issues, and post-trip feedback with warmth and speed',
      'Document every conversation in structured notes — pattern recognition is half this job',
      'Build and maintain a self-learning knowledge base that grows more complete every week',
      'Write weekly product intelligence reports: what users asked, what confused them, what they loved',
      'Capture suggestions, feature ideas, and unmet needs that surface in member conversations',
      'Work with the founding team to close the loop — your reports go directly into product decisions',
    ],
    whoWeLookingFor: [
      'Clear, warm communicator in both English and Hindi — on call and in writing',
      "You think in systems and document obsessively — not because you're asked to, but because you get why it matters",
      'High empathy, zero ego — members remember how you made them feel, not what you said',
      'Comfortable using AI tools to summarise, tag, and surface patterns from conversations',
      'Responsive. Sub-5-minute reply times on working hours is the bar, not the stretch goal',
      'Bonus: experience with Intercom, Notion, Typeform, or any CRM/feedback tool',
    ],
    toolsLabel: "Tools you'll use",
    toolTags: [
      'WhatsApp Business',
      'Intercom / Crisp',
      'Notion',
      'Google Meet',
      'Claude / ChatGPT',
      'Loom',
    ],
  },
  'voice-architect': {
    slug: 'voice-architect',
    glyph: GLYPH.quote,
    roleNumber: '04',
    categoryLabel: 'Role 04 · Voice × Copy',
    title: 'Founding Voice Architect',
    tagline: '"Like Hinge, but for travelers." Someone wrote that. We need that person full-time.',
    whatThisIs:
      "The website. The captions. The quiz copy. The email that lands at midnight before someone's first trip. The one-liner on a Reel that makes someone DM their friend. Every word that comes out of Togetha is owned by one person. Togetha has a very specific voice — romantic, direct, slightly cinematic, never cheesy. It sounds like someone who's been on a real trip and came back changed. You're not just writing captions. You're building the language system that makes Togetha sound like Togetha, always.",
    whatYouWillOwn: [
      'Write all website copy — hero sections, batch descriptions, how it works, quiz flow, microcopy, error states, CTAs',
      'Own every Instagram caption, carousel headline, story text, and bio update',
      'Write email sequences — pre-trip onboarding, post-booking confirmations, waitlist drips, post-trip follow-ups',
      'Script Reels and short-form videos before they go to the motion team — hook, body, CTA',
      'Write influencer briefs that tell creators exactly how to sound like Togetha without killing their authenticity',
      'Maintain the brand voice guide — the living document every team member uses before they write a single word',
      'Write campaign copy for batch launches, new destination drops, and seasonal moments',
      'Brief the Visual Architect on messaging direction before any design work starts',
    ],
    whoWeLookingFor: [
      'Writing portfolio — show us one piece of brand copy or social writing that has a real point of view',
      "You've written for social-first brands — you understand that a caption is not a sentence, it's a feeling",
      'Fluent in the tone gap between Gen Z and Millennial — you know when to switch and how',
      'Fast. First draft within an hour of a brief. Revision within 30 minutes. Ship before sunset',
      'Uses AI tools (Claude, ChatGPT) as a thinking partner, not a ghostwriter — your voice should still come through',
      'Understands SEO basics for web copy without letting it kill the prose',
      'Bonus: experience in travel, dating, lifestyle, or community-led brands',
      'Bonus: can write in Hinglish naturally — not translated Hindi, not forced code-switching',
    ],
    toolsLabel: "Surfaces you'll write for",
    toolTags: [
      'Website',
      'Instagram',
      'Email sequences',
      'Reel scripts',
      'Influencer briefs',
      'WhatsApp copy',
      'Pitch decks',
      'Voice guide',
    ],
    teamCollaboration: [
      {
        glyph: '✦',
        title: 'Visual Architect',
        description:
          'You brief them on what a post needs to say. They make it look right. Copy comes before canvas.',
      },
      {
        glyph: '◈',
        title: 'Motion Storyteller',
        description:
          'You script every video — hook, narration, on-screen text. They cut to your words, not the other way around.',
      },
      {
        glyph: '♡',
        title: 'Member Experience Lead',
        description:
          'You write the language playbook they use. Every member interaction sounds like Togetha because you wrote the script.',
      },
      {
        glyph: '◈',
        title: 'Founding team',
        description:
          "Direct line. You're in every campaign conversation before it becomes a campaign.",
      },
    ],
  },
}

export const INTERN_TRACKS = CAREERS_ROLES

export function getCareersRole(slug: string): CareersRole | null {
  if (slug in CAREERS_ROLES) {
    return CAREERS_ROLES[slug as InternTrackSlug]
  }
  return null
}

export function getAllCareersRoles(): CareersRole[] {
  return INTERN_TRACK_SLUGS.map((slug) => CAREERS_ROLES[slug])
}

export function getInternTrack(slug: string): CareersRole | null {
  return getCareersRole(slug)
}

export function getAllInternTracks(): CareersRole[] {
  return getAllCareersRoles()
}

export function getInternTrackSlugs(): InternTrackSlug[] {
  return [...INTERN_TRACK_SLUGS]
}

export function isInternTrackSlug(slug: string): slug is InternTrackSlug {
  return slug in CAREERS_ROLES
}

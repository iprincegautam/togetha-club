import {
  IncludesTab,
  ItineraryTab,
  PolicyTab,
  ReviewsTab,
  VibeTab,
  type PolicyData,
  type ReviewData,
  type VibeCardData,
} from '@/components/batches/BatchTabPanels'
import {
  BATCH_A_INCLUDES,
  BATCH_A_ITINERARY,
  BATCH_A_NOT_INCLUDED,
  BATCH_B_INCLUDES,
  BATCH_B_ITINERARY,
  BATCH_B_NOT_INCLUDED,
} from '@/lib/batch-trip-data'
import {
  BATCH_D_INCLUDES,
  BATCH_D_ITINERARY,
  BATCH_D_NOT_INCLUDED,
  BATCH_E_INCLUDES,
  BATCH_E_ITINERARY,
  BATCH_E_NOT_INCLUDED,
} from '@/lib/batch-trip-data-udaipur'
import { VIBE_GLYPH } from '@/constants/brand-glyphs'

const BATCH_A_VIBE_CARDS: VibeCardData[] = [
  { icon: VIBE_GLYPH.energy, title: 'Electric Energy', desc: 'GenZ moves fast. Our games and activities match that pace. Nothing is slow or boring.' },
  { icon: VIBE_GLYPH.unscripted, title: 'Unscripted Moments', desc: "We create conditions. The chaos is yours. You'll have stories you can't put in a caption." },
  { icon: VIBE_GLYPH.ease, title: 'Zero Pressure', desc: 'No roses, no eliminations. If something happens, it happens. If not, you made 23 great friends.' },
  { icon: VIBE_GLYPH.mountains, title: 'Real Settings', desc: "Mountains strip pretense. By day 3 nobody is performing. That's when the real stuff starts." },
  { icon: VIBE_GLYPH.night, title: 'Midnight Confessions', desc: 'The best conversations happen after midnight at altitude. We create space for those.' },
  { icon: VIBE_GLYPH.offline, title: 'Low-Wifi, High-Vibe', desc: "Patchy signal means actual eye contact. You'll notice you don't miss the phone." },
]

const BATCH_A_REVIEWS: ReviewData[] = [
  {
    text: 'I was the most skeptical person there. I literally told my roommate this was going to be cringe. By day 3 I was crying at a bonfire because someone finally got what I was saying. No cap.',
    initials: 'AK',
    avatarClass: 'av-teal',
    name: 'Aryan K., 24',
    sub: "Delhi · Batch Pilot '25",
  },
  {
    text: "Met someone on Day 2. We didn't say anything to each other for two days. On Day 4 at the bonfire we stayed back after everyone left. We've been talking every day since. That's 3 months now.",
    initials: 'SR',
    avatarClass: 'av-rose',
    name: 'Sneha R., 23',
    sub: "Mumbai · Batch Pilot '25",
  },
  {
    text: 'The ice breaker games are unhinged. Like someone really thought hard about how to make 24 strangers actually talk to each other. Also the food was incredible somehow. 10/10 would go again.',
    initials: 'VK',
    avatarClass: 'av-gold',
    name: 'Varun K., 26',
    sub: "Bangalore · Batch Pilot '25",
  },
]

const BATCH_A_POLICIES: PolicyData[] = [
  { title: '— Cancellation — 30+ days', text: 'Full refund minus ₹999 processing fee. No questions asked.' },
  { title: '— Cancellation — 15–29 days', text: '50% refund. You may transfer your spot to another approved applicant.' },
  { title: '— Cancellation — under 15 days', text: 'No refund. However, spot transfer allowed up to 7 days before departure.' },
  { title: '✓ Verification failure', text: 'If your ID verification fails post-payment, full refund within 5–7 business days.' },
  { title: '± Code of conduct', text: 'Zero tolerance for harassment or disrespect. Violators are removed immediately with no refund.' },
  { title: '△ Weather / Force majeure', text: 'If weather forces route change, we find the best alternative. If trip cancels, full refund.' },
]

const BATCH_A_FAQ = [
  {
    question: 'Is this literally like Love Island?',
    answer:
      "No eliminations, no cameras, no producers engineering drama. It's just 24 real single people on a real trip with deliberate activities designed to accelerate connection. What you do with that is entirely your call. Some people find partners. Some find best friends. Some just have the best trip of their life.",
  },
  {
    question: "What happens if I don't click with anyone romantically?",
    answer:
      "You still get 5 nights in the Himalayas with 23 interesting, vetted, single people who chose to do something different with their time. The worst outcome is: incredible trip, 23 new friends, and a story you'll tell for years. That's a pretty good worst case.",
  },
  {
    question: 'How do I book my spot?',
    answer:
      "Take the quiz, pick your Friday departure on togetha.club, and pay to lock your slot. Once payment goes through you're in — 12 boys and 12 girls on the same trip. Our AI uses your quiz to place you in the best-fit cohort. You meet everyone on Day 1.",
  },
  {
    question: 'Is there a gender balance guarantee?',
    answer:
      'Yes. Every batch is exactly 12 boys and 12 girls. If a spot opens due to cancellation, we fill it with the same gender from the waitlist before departure. We will delay a trip rather than send an imbalanced group.',
  },
  {
    question: 'What are the ice breaker games like?',
    answer:
      "Custom-designed activities over 3 rounds across the trip. Round 1 is fun and light — get to know everyone's names and vibes. Round 2 goes deeper — what you actually believe, what you're actually looking for. Round 3 is on Day 5 and it's honest in a way that surprises most people. We can't tell you more without spoiling it.",
  },
  {
    question: 'What if I need a single room?',
    answer:
      "Same-gender room sharing is the default (2-3 people). If you want a private room, you can request it at ₹4,000 extra — subject to availability at each property. Most people don't bother once they're actually there.",
  },
  {
    question: 'Can I come with a friend?',
    answer:
      "Each person books their own slot. If you're both coming, yes — but we won't always pair you in room/activity groups. The point is to push you to meet the other 22 people. Coming with a friend sometimes creates a safety bubble that defeats the purpose.",
  },
  {
    question: "I'm shy / introverted. Is this for me?",
    answer:
      "Some of our best connections have been between introverts who finally found someone who operates at their pace. The activities are designed so nobody has to perform. There's always free time. Nobody will force you to do anything. And honestly, the mountains help with this more than we can explain.",
  },
]

const BATCH_B_VIBE_CARDS: VibeCardData[] = [
  { icon: VIBE_GLYPH.pace, title: 'Slower Pace', desc: 'More sitting, more conversations, more depth. Less running around, more noticing.' },
  { icon: VIBE_GLYPH.depth, title: 'Deeper Prompts', desc: "Our connection sessions are designed for people who've thought about what they want." },
  { icon: VIBE_GLYPH.letter, title: 'The Letter Exchange', desc: 'Write to someone. Anonymous. Delivered on the last day. We added this because it keeps working.' },
  { icon: VIBE_GLYPH.stillness, title: 'No Performance', desc: "Everyone here has done the thing where you perform at first. You won't need to here." },
  { icon: VIBE_GLYPH.live, title: 'Live Music', desc: 'A musician at the bonfire night. Not a playlist — a person playing in the mountains.' },
  { icon: VIBE_GLYPH.write, title: 'Journaling Ritual', desc: 'A guided journaling hour on Day 3. For the people who think by writing. Yours to keep.' },
]

const BATCH_B_REVIEWS: ReviewData[] = [
  {
    text: "I'm 33 and I'd given up on the idea that I'd meet someone organically. Everything felt so manufactured. This was the first thing in years that didn't feel like that. We're not together — but we're close. Closer than most people I've known for years.",
    initials: 'PR',
    avatarClass: 'av-rose',
    name: 'Priya R., 33',
    sub: "Pune · Millennial Pilot '25",
  },
  {
    text: "Day 5 at Sissu Lake. We were sitting by the water. She'd mentioned something on Day 2 that I'd been thinking about for three days. I finally said it. She started crying. Good crying. That was four months ago. We're figuring things out.",
    initials: 'AM',
    avatarClass: 'av-teal',
    name: 'Abhishek M., 31',
    sub: "Delhi · Millennial Pilot '25",
  },
  {
    text: "The letter exchange on the last day wrecked me (in a good way). I didn't connect romantically with anyone — but someone wrote me the most honest, kind thing I've read in years. Still have it on my desk.",
    initials: 'NK',
    avatarClass: 'av-gold',
    name: 'Neha K., 30',
    sub: "Mumbai · Millennial Pilot '25",
  },
]

const BATCH_B_POLICIES: PolicyData[] = [
  { title: '— 30+ days before', text: 'Full refund minus ₹999 processing fee.' },
  { title: '— 15–29 days before', text: '50% refund. Spot transfer allowed to another approved applicant.' },
  { title: '— Under 15 days', text: 'No refund. Spot transfer allowed up to 7 days before departure.' },
  { title: '✓ KYC failure', text: 'Full refund within 5–7 business days if verification fails.' },
  { title: '± Conduct', text: 'Zero tolerance policy. Removed immediately with no refund.' },
  { title: '△ Force majeure', text: 'Route changes if needed. Trip cancellation = full refund.' },
]

const BATCH_B_FAQ = [
  {
    question: 'Is this only for people who want a relationship?',
    answer:
      "No. The screened intent is \"open to something real\" — which could mean a relationship, a meaningful friendship, or just an experience that reminds you that interesting people exist. We don't ask you to be \"looking for marriage.\" We ask you to be genuine and open.",
  },
  {
    question: "I'm 36. Is that too old?",
    answer:
      "No. The Millennial batch is 26–36. We've found this age range has remarkable chemistry because everyone's past the phase of figuring themselves out. You know what you want. So does everyone else. That's powerful.",
  },
  {
    question: 'What is the letter exchange?',
    answer:
      "On Day 5, everyone writes a letter — to someone in the group who affected them over the trip. It can be romantic, platonic, grateful, whatever. Anonymous until we deliver them on Day 6 morning. We started this in our pilot and it became the most talked-about moment of the entire trip. We're keeping it forever.",
  },
  {
    question: 'Alcohol at bonfire — is that mandatory?',
    answer:
      "Absolutely not. The bonfire works without alcohol — always has. We offer premium options for those who want them. If you don't drink, you're not excluded from anything. The conversations are the point, not the drink.",
  },
  {
    question: 'How is this different from a regular group trip?',
    answer:
      'A regular group trip has people with different intentions — some want to party, some want peace, some want photos. This trip has 24 people who all signed up for the same thing: to be present, to meet someone real, to have a genuine experience. That shared intention changes everything about how people interact.',
  },
  {
    question: 'Will you tell me who else is in my batch?',
    answer:
      "No. We share nothing before the trip — not names, not ages, not photos. The meeting on Day 1 is completely cold and that's intentional. It eliminates pre-trip social media stalking, which we've found kills the authenticity of first meetings.",
  },
]

import { getFallbackDateOptions } from '@/lib/batch-departure-dates'

const BATCH_A_DATES = getFallbackDateOptions('batch-a')
const BATCH_B_DATES = getFallbackDateOptions('batch-b')
const BATCH_D_DATES = getFallbackDateOptions('batch-d')
const BATCH_E_DATES = getFallbackDateOptions('batch-e')

const UDAIPUR_VIBE_CARDS: VibeCardData[] = [
  {
    icon: VIBE_GLYPH.ease,
    title: 'Safe by Design',
    desc: 'Always 12 women and 12 men, ID-verified before confirmation, and single-gender room sharing.',
  },
  {
    icon: VIBE_GLYPH.depth,
    title: 'Matched, Not Random',
    desc: 'Every person completes the compatibility quiz before joining the verified group of 24.',
  },
  {
    icon: VIBE_GLYPH.unscripted,
    title: 'No Pressure',
    desc: 'Join what you want, skip what you do not. No forced games, staged reveals, or compatibility scores.',
  },
  {
    icon: VIBE_GLYPH.night,
    title: 'A Better First Night',
    desc: 'The hosted Bollywood house party gets everyone laughing together without anyone having to perform.',
  },
]

const UDAIPUR_POLICIES: PolicyData[] = [
  {
    title: '✓ Verified batch',
    text: 'Every batch is exactly 12 women and 12 men. Everyone is ID-verified before confirmation.',
  },
  {
    title: '✓ Rooms & hosts',
    text: 'Room sharing is single-gender. Trained Togetha trip captains are with the group day and night.',
  },
  {
    title: '✓ Your choice',
    text: 'Participation is optional. We never force a match, stage a reveal, or promise romance.',
  },
  {
    title: '— Cancellation & refunds',
    text: 'Your booking amount reserves the seat; the balance is due at least 7 days before departure. Read the cancellation and refund policy before paying.',
  },
]

const UDAIPUR_FAQ = [
  {
    question: 'Is it actually safe — who is on the trip?',
    answer:
      "Every batch is exactly 12 women and 12 men, and everyone is ID-verified before they're confirmed. You never share a room across genders, trained trip captains are with the group day and night, and every stay and venue is vetted by us.",
  },
  {
    question: "I'm introverted — is this still for me?",
    answer:
      "Yes. Everything is structured so nobody has to perform, there is real free time, and participation is always optional. The lakes, fort, and small group moments do a lot of the work.",
  },
  {
    question: "What if I don't meet anyone romantically?",
    answer:
      "You still spend three days in Udaipur with 23 interesting, verified singles who chose to show up. Romance is possible, never guaranteed — and that is intentional.",
  },
  {
    question: 'Can I come with a friend?',
    answer:
      'Yes — each person books their own seat. We may not always room or group you together because the point is to meet the other 22 people rather than stay in a bubble.',
  },
  {
    question: 'How do I book, and what about refunds?',
    answer:
      'Take the quiz, pick your weekend, and reserve your seat with the booking amount. The balance is due at least 7 days before departure. Read the full cancellation and refund terms before you pay.',
  },
]

function buildBatchATabs() {
  return [
    {
      id: 'itinerary',
      label: 'Day-by-Day',
      content: (
        <ItineraryTab
          title="5 nights · 6 days — Manali, Sissu & Kasol."
          days={BATCH_A_ITINERARY}
        />
      ),
    },
    {
      id: 'whats-in',
      label: "What's Included",
      content: (
        <IncludesTab
          label="In the box"
          title="Everything that makes it work."
          items={BATCH_A_INCLUDES}
          notIncluded={BATCH_A_NOT_INCLUDED}
        />
      ),
    },
    {
      id: 'vibe',
      label: 'The Vibe',
      content: (
        <VibeTab
          label="The Energy"
          title="GenZ Edition — what to expect."
          intro={`You've been on Hinge for three years. You're exhausted. The dates feel like job interviews. The conversations die after 4 messages. You scroll past 50 people before breakfast. You want something real — but you don't want to admit it.\n\nSo we made this trip for you.`}
          cards={BATCH_A_VIBE_CARDS}
        />
      ),
    },
    {
      id: 'reviews',
      label: 'Reviews',
      content: (
        <ReviewsTab
          label="What people are saying"
          title="Early members who experienced our pilot trips."
          reviews={BATCH_A_REVIEWS}
        />
      ),
    },
    {
      id: 'policy',
      label: 'Policies',
      content: (
        <PolicyTab label="The fine print" title="Clear, fair, no surprises." policies={BATCH_A_POLICIES} />
      ),
    },
  ]
}

function buildBatchBTabs() {
  return [
    {
      id: 'itinerary',
      label: 'Day-by-Day',
      content: (
        <ItineraryTab
          title="Same route. Slower pace. Manali → Sissu → Kasol."
          days={BATCH_B_ITINERARY}
          roseAccent
        />
      ),
    },
    {
      id: 'whats-in',
      label: "What's Included",
      content: (
        <IncludesTab
          label="Premium inclusions"
          title="Everything included. Nothing left to chance."
          items={BATCH_B_INCLUDES}
          notIncluded={BATCH_B_NOT_INCLUDED}
        />
      ),
    },
    {
      id: 'vibe',
      label: 'The Vibe',
      content: (
        <VibeTab
          label="Who this is for"
          title="The Millennial Edition — a different pace."
          intro={`You're 26–36. You have your life together — career, apartment, maybe even a car. The thing you don't have figured out is this. Dating in your 30s in India is strange. The apps feel beneath you. The arranged marriage pressure is exhausting. The people who "get it" seem impossible to find in normal life.\n\nThis trip is for you.`}
          cards={BATCH_B_VIBE_CARDS}
        />
      ),
    },
    {
      id: 'reviews',
      label: 'Reviews',
      content: (
        <ReviewsTab
          label="Early stories"
          title="From people who were skeptical too."
          reviews={BATCH_B_REVIEWS}
        />
      ),
    },
    {
      id: 'policy',
      label: 'Policies',
      content: (
        <PolicyTab label="The fine print" title="Same fairness. Same clarity." policies={BATCH_B_POLICIES} />
      ),
    },
  ]
}

function buildBatchDTabs() {
  return [
    {
      id: 'itinerary',
      label: 'Day-by-Day',
      content: (
        <ItineraryTab
          title="3 days — Gurugram · Udaipur · Kumbhalgarh."
          days={BATCH_D_ITINERARY}
        />
      ),
    },
    {
      id: 'whats-in',
      label: "What's Included",
      content: (
        <IncludesTab
          label="In the box"
          title="Everything’s handled. You just show up."
          items={BATCH_D_INCLUDES}
          notIncluded={BATCH_D_NOT_INCLUDED}
        />
      ),
    },
    {
      id: 'vibe',
      label: 'The Vibe',
      content: (
        <VibeTab
          label="What this actually is"
          title="Not a dating app. Not a random group tour."
          intro={`Take a short compatibility quiz, get matched into a balanced batch of 24 verified singles, and spend three days in the City of Lakes with people you are genuinely likely to click with.\n\nNo swiping, no ghosting, no performing for a profile — just real people in a real place, with everything planned for you.`}
          cards={UDAIPUR_VIBE_CARDS}
        />
      ),
    },
    {
      id: 'policy',
      label: 'Policies',
      content: (
        <PolicyTab label="The honest bit" title="Safe by design, not as an afterthought." policies={UDAIPUR_POLICIES} />
      ),
    },
  ]
}

function buildBatchETabs() {
  return [
    {
      id: 'itinerary',
      label: 'Day-by-Day',
      content: (
        <ItineraryTab
          title="3 days — Gurugram · Udaipur · Kumbhalgarh."
          days={BATCH_E_ITINERARY}
          roseAccent
        />
      ),
    },
    {
      id: 'whats-in',
      label: "What's Included",
      content: (
        <IncludesTab
          label="What’s included"
          title="Everything’s handled. You just show up."
          items={BATCH_E_INCLUDES}
          notIncluded={BATCH_E_NOT_INCLUDED}
        />
      ),
    },
    {
      id: 'vibe',
      label: 'The Vibe',
      content: (
        <VibeTab
          label="What this actually is"
          title="Not a dating app. Not a random group tour."
          intro={`Take a short compatibility quiz, get matched into a balanced batch of 24 verified singles, and spend three days in the City of Lakes with people you are genuinely likely to click with.\n\nNo swiping, no ghosting, no performing for a profile — just real people in a real place, with everything planned for you.`}
          cards={UDAIPUR_VIBE_CARDS}
        />
      ),
    },
    {
      id: 'policy',
      label: 'Policies',
      content: (
        <PolicyTab label="The honest bit" title="Safe by design, not as an afterthought." policies={UDAIPUR_POLICIES} />
      ),
    },
  ]
}

export function buildBatchTabs(slug: string) {
  switch (slug) {
    case 'batch-a':
      return buildBatchATabs()
    case 'batch-b':
      return buildBatchBTabs()
    case 'batch-d':
      return buildBatchDTabs()
    case 'batch-e':
      return buildBatchETabs()
    default:
      return []
  }
}

export function buildBatchFaq(slug: string) {
  switch (slug) {
    case 'batch-a':
      return BATCH_A_FAQ
    case 'batch-b':
      return BATCH_B_FAQ
    case 'batch-d':
      return UDAIPUR_FAQ
    case 'batch-e':
      return UDAIPUR_FAQ
    default:
      return []
  }
}

export { BATCH_A_DATES, BATCH_B_DATES, BATCH_D_DATES, BATCH_E_DATES }

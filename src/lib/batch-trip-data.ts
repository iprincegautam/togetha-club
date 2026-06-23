import type { IncludeItem, ItineraryDay } from '@/components/batches/BatchTabPanels'
import { INCLUDE_GLYPH } from '@/constants/brand-glyphs'
import type { MatchableBatchSlug } from '@/types/match'

/** Shared exclusions — aligned with operational trip PDF. */
export const TRIP_NOT_INCLUDED = [
  'Extra meals or stays beyond what is listed under inclusions',
  'Travel insurance, porterage, tips, laundry, and other personal expenses',
  'Entry fees and optional activity tickets (e.g. Solang Valley adventures, paragliding, river rafting)',
  'Snow-chain or 4×4 vehicle supplement if required due to heavy snowfall',
  'Costs from force majeure — weather, roadblocks, landslides, riots, or similar events beyond our control',
  'Anything not explicitly listed under inclusions',
  'GST (5%) where applicable',
  'Flights or personal travel to/from the Delhi boarding point',
]

export const BATCH_A_ITINERARY: ItineraryDay[] = [
  {
    num: 0,
    location: 'Delhi → Manali',
    title: 'Overnight journey',
    activities: [
      { text: 'Assemble at Delhi boarding point (Majnu Ka Tilla area — exact location shared 24h before departure)', variant: 'gold' },
      { text: 'Meet your batch & trip lead on the bus', variant: 'gold' },
      { text: 'Ice Breaker Round 1 — names, vibes, first impressions', variant: 'highlight' },
      { text: 'Overnight journey to Manali — socialise with co-travellers', variant: 'gold' },
    ],
  },
  {
    num: 1,
    location: '△ Manali',
    title: 'Arrival & local exploration',
    activities: [
      { text: 'Arrive Manali — hotel check-in & freshen up', variant: 'gold' },
      { text: 'Hadimba Devi Temple & Van Vihar forest walk', variant: 'gold' },
      { text: 'Old Manali café hopping — Ice Breaker Round 2 (paired conversations)', variant: 'highlight' },
      { text: 'Mall Road evening — street food, shopping & people-watching', variant: 'gold' },
      { text: 'Group dinner (assigned seating) · overnight in Manali', variant: 'highlight' },
      { text: 'Meals included: Dinner', variant: 'gold' },
    ],
  },
  {
    num: 2,
    location: '△ Sissu & Solang',
    title: 'Day trip via Atal Tunnel',
    activities: [
      { text: 'Breakfast at hotel', variant: 'gold' },
      { text: 'Drive to Lahaul via Atal Tunnel — landscape shifts from Kullu to Lahaul', variant: 'gold' },
      { text: 'Sissu village & Sissu Lake visit (weather permitting)', variant: 'gold' },
      { text: 'Solang Valley stop — adventure activities (optional, at your own cost)', variant: 'gold' },
      { text: 'Return to Manali — rooftop chai & group hangout', variant: 'gold' },
      { text: 'Group dinner · overnight in Manali', variant: 'gold' },
      { text: 'Meals included: Breakfast · Dinner', variant: 'gold' },
    ],
  },
  {
    num: 3,
    location: 'Kasol',
    title: 'Manali to Kasol · Parvati Valley',
    activities: [
      { text: 'Breakfast, checkout & scenic drive Manali → Kasol', variant: 'gold' },
      { text: 'En route: optional paragliding or rafting at Kullu (at your own cost)', variant: 'gold' },
      { text: 'Check-in at Kasol hotel/campsite', variant: 'gold' },
      { text: 'Chalal bridge walk & Parvati riverside chill', variant: 'gold' },
      { text: 'Café hopping — paired evening activity', variant: 'highlight' },
      { text: 'BONFIRE NIGHT (weather permitting) — guitar, stories & stargazing', variant: 'rose' },
      { text: 'Home-style group dinner · overnight in Kasol', variant: 'gold' },
      { text: 'Meals included: Breakfast · Dinner', variant: 'gold' },
    ],
  },
  {
    num: 4,
    location: 'Manikaran → Delhi',
    title: 'Hot springs & overnight return',
    activities: [
      { text: 'Breakfast & checkout from Kasol', variant: 'gold' },
      { text: 'Manikaran Sahib Gurudwara — holy hot water springs & Shiva Temple', variant: 'gold' },
      { text: 'Kasol local market — free time & last looks', variant: 'gold' },
      { text: 'Ice Breaker Round 3 — final honesty round with the group', variant: 'highlight' },
      { text: 'Evening: start overnight journey back to Delhi', variant: 'gold' },
      { text: 'Meals included: Breakfast', variant: 'gold' },
    ],
  },
  {
    num: 5,
    location: '→ Delhi',
    title: 'Trip ends',
    activities: [
      { text: 'Early morning arrival in Delhi', variant: 'gold' },
      { text: 'Private group WhatsApp unlocked', variant: 'gold' },
      'Whatever happens next is up to you.',
    ],
  },
]

export const BATCH_B_ITINERARY: ItineraryDay[] = [
  {
    num: 0,
    location: 'Delhi → Manali',
    title: 'Overnight journey',
    activities: [
      { text: 'Assemble at Delhi boarding point (Majnu Ka Tilla area — exact location shared 24h before departure)', variant: 'gold' },
      { text: 'Welcome circle with trip lead & co-lead', variant: 'gold' },
      { text: 'Deep Connection Game — Round 1 on the bus', variant: 'rose' },
      { text: 'Overnight journey to Manali', variant: 'gold' },
    ],
  },
  {
    num: 1,
    location: '△ Manali',
    title: 'Slow arrival & Old Manali',
    activities: [
      { text: 'Arrive Manali — boutique hotel check-in', variant: 'gold' },
      { text: 'Hadimba Temple & unhurried walk through Old Manali', variant: 'gold' },
      { text: 'Deep Connection Game — Round 2 over café lunch', variant: 'rose' },
      { text: 'Mall Road at your pace — curated dinner with assigned seating', variant: 'highlight' },
      { text: 'Evening wine & stories at the guesthouse', variant: 'gold' },
      { text: 'Meals included: Dinner', variant: 'gold' },
    ],
  },
  {
    num: 2,
    location: '△ Sissu & Solang',
    title: 'Above the clouds',
    activities: [
      { text: 'Leisurely breakfast', variant: 'gold' },
      { text: 'Atal Tunnel → Sissu village & Sissu Lake (weather permitting)', variant: 'gold' },
      { text: 'Solang Valley — optional adventure activities (at your own cost)', variant: 'gold' },
      { text: 'Return to Manali — journaling hour & quiet conversations', variant: 'gold' },
      { text: 'Curated group dinner · overnight in Manali', variant: 'gold' },
      { text: 'Meals included: Breakfast · Dinner', variant: 'gold' },
    ],
  },
  {
    num: 3,
    location: 'Kasol',
    title: 'The Parvati Valley',
    activities: [
      { text: 'Breakfast, checkout & drive to Kasol', variant: 'gold' },
      { text: 'Optional paragliding/rafting en route (at your own cost)', variant: 'gold' },
      { text: 'Check-in Kasol — paired riverside walk (we assign pairs)', variant: 'highlight' },
      { text: 'Sunset meditation / journaling by the Parvati', variant: 'gold' },
      { text: 'BONFIRE NIGHT (weather permitting) — live music, wine & whisky', variant: 'rose' },
      { text: 'Group dinner under fairy lights · overnight in Kasol', variant: 'gold' },
      { text: 'Meals included: Breakfast · Dinner', variant: 'gold' },
    ],
  },
  {
    num: 4,
    location: 'Manikaran → Delhi',
    title: 'Letters & the road home',
    activities: [
      { text: 'Breakfast & checkout from Kasol', variant: 'gold' },
      { text: 'Manikaran hot springs visit', variant: 'gold' },
      { text: 'Deep Connection Round 3 — what you want, actually', variant: 'rose' },
      { text: 'Letter exchange prep — write to someone from the trip', variant: 'highlight' },
      { text: 'Evening: overnight journey to Delhi', variant: 'gold' },
      { text: 'Meals included: Breakfast', variant: 'gold' },
    ],
  },
  {
    num: 5,
    location: '→ Delhi',
    title: "You're different now",
    activities: [
      { text: 'Early morning arrival in Delhi', variant: 'gold' },
      { text: 'Anonymous letter delivery from the trip', variant: 'highlight' },
      { text: 'Private group chat unlocked', variant: 'gold' },
    ],
  },
]

export const BATCH_A_INCLUDES: IncludeItem[] = [
  {
    icon: INCLUDE_GLYPH.transport,
    title: 'Delhi–Delhi Transport',
    desc: 'AC semi-sleeper Volvo or tempo traveller between Delhi & the mountains; local tempo/cab for all on-ground travel.',
  },
  {
    icon: INCLUDE_GLYPH.stay,
    title: '3 Nights Accommodation',
    desc: '2 nights hotel in Manali + 1 night hotel/campsite in Kasol. Single-gender sharing rooms.',
  },
  {
    icon: INCLUDE_GLYPH.meals,
    title: '6 Group Meals',
    desc: 'Manali: 2 breakfasts + 2 dinners. Kasol: breakfast + dinner. From dinner on Day 1 through breakfast on Day 4.',
  },
  {
    icon: INCLUDE_GLYPH.guide,
    title: 'Experienced Trip Lead',
    desc: 'Dedicated facilitator with the group throughout — not a tour guide, a vibe curator.',
  },
  {
    icon: INCLUDE_GLYPH.bonfire,
    title: 'Bonfire & Music',
    desc: 'Bonfire setup with music on up to 2 nights during the stay (weather permitting).',
  },
  {
    icon: INCLUDE_GLYPH.transport,
    title: 'Road Taxes & Driver Allowances',
    desc: 'Toll taxes, parking, state taxes, and driver allowances included.',
  },
  {
    icon: INCLUDE_GLYPH.games,
    title: 'Ice Breaker Game Sets',
    desc: 'Three guided rounds woven into the trip — gets progressively more real.',
  },
  {
    icon: INCLUDE_GLYPH.verify,
    title: 'Identity Verification',
    desc: 'Everyone in your batch is verified. No catfishing. No surprises.',
  },
]

export const BATCH_B_INCLUDES: IncludeItem[] = [
  {
    icon: INCLUDE_GLYPH.transport,
    title: 'Delhi–Delhi Transport',
    desc: 'Private AC tempo traveller or cab for the group — Delhi round trip and all on-ground travel.',
  },
  {
    icon: INCLUDE_GLYPH.stay,
    title: '3 Nights Boutique Stay',
    desc: '2 nights boutique hotel in Manali + 1 night in Kasol. Single-gender sharing rooms.',
  },
  {
    icon: INCLUDE_GLYPH.drinks,
    title: '6 Group Meals + Drinks',
    desc: 'Same meal plan as the route (6 meals). Wine & whisky at bonfire night when weather permits.',
  },
  {
    icon: INCLUDE_GLYPH.guide,
    title: 'Lead + Co-Lead',
    desc: 'Two trained facilitators on the trip — they know when to step in and when to disappear.',
  },
  {
    icon: INCLUDE_GLYPH.bonfire,
    title: 'Bonfire Experience',
    desc: 'Full bonfire setup with live music on up to 2 nights (weather permitting).',
  },
  {
    icon: INCLUDE_GLYPH.transport,
    title: 'Road Taxes & Driver Allowances',
    desc: 'Toll taxes, parking, state taxes, and driver allowances included.',
  },
  {
    icon: INCLUDE_GLYPH.connection,
    title: 'Deep Connection Facilitation',
    desc: 'Three guided sessions designed for meaningful conversation — not party games.',
  },
  {
    icon: INCLUDE_GLYPH.letter,
    title: 'Letter Exchange Kit',
    desc: 'Stationery to write to someone in your group. Anonymous delivery on the last morning.',
  },
]

export const BATCH_A_NOT_INCLUDED = TRIP_NOT_INCLUDED
export const BATCH_B_NOT_INCLUDED = TRIP_NOT_INCLUDED

export type BatchTripDetails = {
  itinerary: ItineraryDay[]
  includes: IncludeItem[]
  notIncluded?: string[]
}

export function getBatchTripDetails(batchSlug: MatchableBatchSlug): BatchTripDetails {
  switch (batchSlug) {
    case 'batch-a':
      return {
        itinerary: BATCH_A_ITINERARY,
        includes: BATCH_A_INCLUDES,
        notIncluded: BATCH_A_NOT_INCLUDED,
      }
    case 'batch-b':
      return {
        itinerary: BATCH_B_ITINERARY,
        includes: BATCH_B_INCLUDES,
        notIncluded: BATCH_B_NOT_INCLUDED,
      }
    default:
      return {
        itinerary: BATCH_A_ITINERARY,
        includes: BATCH_A_INCLUDES,
        notIncluded: BATCH_A_NOT_INCLUDED,
      }
  }
}

export type BatchItineraryPresentation = BatchTripDetails & {
  itineraryTitle: string
  includesLabel: string
  includesTitle: string
  roseAccent: boolean
}

export function getBatchItineraryPresentation(batchSlug: MatchableBatchSlug): BatchItineraryPresentation {
  const details = getBatchTripDetails(batchSlug)
  if (batchSlug === 'batch-b') {
    return {
      ...details,
      itineraryTitle: 'Same route. Slower pace. Manali → Sissu → Kasol.',
      includesLabel: 'Premium inclusions',
      includesTitle: 'Everything included. Nothing left to chance.',
      roseAccent: true,
    }
  }
  return {
    ...details,
    itineraryTitle: '3 nights · 4 days — Manali, Sissu & Kasol.',
    includesLabel: 'In the box',
    includesTitle: 'Everything that makes it work.',
    roseAccent: false,
  }
}

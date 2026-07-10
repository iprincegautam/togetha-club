import type { IncludeItem, ItineraryDay } from '@/components/batches/BatchTabPanels'
import { INCLUDE_GLYPH } from '@/constants/brand-glyphs'

/** Final Udaipur & Kumbhalgarh product itinerary. */
export const UDAIPUR_BOARDING_NOTE =
  'the Gurugram boarding point (exact details shared 24 hours before departure)'

export const UDAIPUR_NOT_INCLUDED = [
  'Monument and entry fees, the Karni Mata ropeway, and the Bagore Ki Haveli folk-art show',
  'Meals beyond the 4 group meals listed under inclusions',
  'Travel insurance, tips, laundry, and personal expenses',
  'Costs caused by weather, roadblocks, or other events beyond our control',
  'Anything not explicitly listed under inclusions',
  'Travel to and from the Gurugram boarding point',
]

/** Both age editions use the same final operational itinerary. */
export const UDAIPUR_ITINERARY: ItineraryDay[] = [
  {
    num: 0,
    location: 'Gurugram → Udaipur',
    title: 'The overnight journey',
    activities: [
      { text: `Assemble at ${UDAIPUR_BOARDING_NOTE}`, variant: 'gold' },
      { text: 'Settle onto a comfortable AC coach and leave overnight for Udaipur', variant: 'gold' },
      {
        text: 'Easy hellos with your hand-matched batch — arrive already knowing a few faces',
        variant: 'highlight',
      },
    ],
  },
  {
    num: 1,
    location: '△ Udaipur · City of Lakes',
    title: 'Lakes, bazaars & Bollywood night',
    activities: [
      { text: 'Arrive Udaipur — hotel check-in & freshen up', variant: 'gold' },
      { text: 'Saheliyon Ki Bari, Maharana Pratap Memorial & Under the Sun Aquarium', variant: 'gold' },
      { text: 'Fatehsagar Lake sunset + street-food market', variant: 'gold' },
      {
        text: 'The Bollywood House Party — themed, host-led, verified-guests-only and zero pressure',
        variant: 'rose',
      },
      {
        text: 'Antakshari: Wingman Edition · Guess the Jodi · Filmy Charades · Two Truths, Filmy Style',
        variant: 'highlight',
      },
      { text: 'Group dinner · overnight in Udaipur', variant: 'gold' },
      { text: 'Meals included: Dinner', variant: 'gold' },
    ],
  },
  {
    num: 2,
    location: '△ Udaipur Old City',
    title: 'Palaces, ghats & lake-view cafés',
    activities: [
      { text: 'Breakfast at hotel', variant: 'gold' },
      { text: 'City Palace and Mewar history', variant: 'gold' },
      { text: 'Jagdish Temple and Karni Mata Temple', variant: 'gold' },
      {
        text: 'Bagore Ki Haveli folk-art show or café-hopping along Lake Pichola and Gangaur Ghat',
        variant: 'highlight',
      },
      {
        text: 'Paired café walks and thoughtfully seated group dinner for easy, real conversation',
        variant: 'highlight',
      },
      { text: 'Group dinner · overnight in Udaipur', variant: 'gold' },
      { text: 'Meals included: Breakfast · Dinner', variant: 'gold' },
    ],
  },
  {
    num: 3,
    location: 'Kumbhalgarh → Gurugram',
    title: 'The Great Wall of India',
    activities: [
      { text: 'Breakfast & checkout from hotel', variant: 'gold' },
      {
        text: 'Drive to UNESCO-listed Kumbhalgarh Fort and walk its astonishing 38 km rampart',
        variant: 'gold',
      },
      {
        text: 'A slow walk and sunset view — the final chance to see who you are drawn to',
        variant: 'highlight',
      },
      { text: 'Begin the overnight journey home', variant: 'gold' },
      { text: 'Meals included: Breakfast', variant: 'gold' },
    ],
  },
  {
    num: 4,
    location: '→ Gurugram',
    title: 'Home, with a new circle',
    activities: [
      { text: 'Early morning arrival in Gurugram', variant: 'gold' },
      { text: 'Your private, verified batch group stays open', variant: 'gold' },
      'No forced matches, no reveal, no scores. Who you keep talking to is entirely up to you.',
    ],
  },
]

export const BATCH_D_ITINERARY = UDAIPUR_ITINERARY
export const BATCH_E_ITINERARY = UDAIPUR_ITINERARY

export const UDAIPUR_INCLUDES: IncludeItem[] = [
  {
    icon: INCLUDE_GLYPH.transport,
    title: 'Return Travel from Gurugram',
    desc: 'Comfortable AC coach both ways, including tolls, parking, and road taxes.',
  },
  {
    icon: INCLUDE_GLYPH.stay,
    title: '2 Nights’ Stay in Udaipur',
    desc: 'A vetted Udaipur hotel with single-gender sharing rooms.',
  },
  {
    icon: INCLUDE_GLYPH.meals,
    title: '4 Group Meals',
    desc: '2 dinners + 2 breakfasts — from Day 1 dinner through Day 3 breakfast.',
  },
  {
    icon: INCLUDE_GLYPH.bonfire,
    title: 'The Bollywood House Party',
    desc: 'A themed, hosted night with verified guests only, a great playlist, and easy no-cringe games.',
  },
  {
    icon: INCLUDE_GLYPH.guide,
    title: 'Trip Captains & Your Batch',
    desc: 'Trained hosts with the group throughout, plus 23 matched and verified singles.',
  },
  {
    icon: INCLUDE_GLYPH.verify,
    title: 'All Sightseeing on the Plan',
    desc: 'Every listed stop is organised and guided by the Togetha team.',
  },
]

export const BATCH_D_INCLUDES = UDAIPUR_INCLUDES
export const BATCH_E_INCLUDES = UDAIPUR_INCLUDES
export const BATCH_D_NOT_INCLUDED = UDAIPUR_NOT_INCLUDED
export const BATCH_E_NOT_INCLUDED = UDAIPUR_NOT_INCLUDED

import type { ComponentType } from 'react'

export type BatchGallerySlide = {
  id: string
  caption: string
  /** Raster image under /public — preferred when set. */
  src?: string
  /** Legacy SVG placeholder component. */
  Visual?: ComponentType
}

const HIMALAYAN_GALLERY: BatchGallerySlide[] = [
  {
    id: 'safety',
    caption: 'Your safety is the product — verified by a real person',
    src: '/batches/himalayan/safety-verified.jpg',
  },
  {
    id: 'dating-fatigue',
    caption: 'Done with dating apps — ready for the mountains',
    src: '/batches/himalayan/dating-apps-fatigue.jpg',
  },
  {
    id: 'funnel',
    caption: 'Quiz → match → pick your Friday → human review',
    src: '/batches/himalayan/how-it-works-funnel.jpg',
  },
  {
    id: 'matchmaking',
    caption: 'The matchmaking machine — companions, not coincidences',
    src: '/batches/himalayan/matchmaking-machine.jpg',
  },
  {
    id: 'campfire',
    caption: 'Manali · Kasol · Sissu — real friendships around the fire',
    src: '/batches/himalayan/campfire-friendships.jpg',
  },
]

const UDAIPUR_GALLERY: BatchGallerySlide[] = [
  {
    id: 'anonymous-profiles',
    caption: 'Who are these strangers — is it safe?',
    src: '/batches/udaipur/anonymous-profiles.jpg',
  },
  {
    id: 'safety',
    caption: 'Your safety is the product — verified by a real human',
    src: '/batches/udaipur/safety-verified.jpg',
  },
  {
    id: 'dating-fatigue',
    caption: 'Done with dating apps — ready for the lakes',
    src: '/batches/udaipur/dating-apps-fatigue.jpg',
  },
  {
    id: 'bollywood-party',
    caption: 'Bollywood house party — 12+12 balanced & verified',
    src: '/batches/udaipur/bollywood-house-party.jpg',
  },
  {
    id: 'lake-friendships',
    caption: 'Udaipur · Kumbhalgarh — real friendships and a story',
    src: '/batches/udaipur/lake-friendships.jpg',
  },
  {
    id: 'funnel',
    caption: 'Quiz → match → pick your weekend → human review',
    src: '/batches/udaipur/how-it-works-funnel.jpg',
  },
]

export const BATCH_GALLERY: Record<string, BatchGallerySlide[]> = {
  'batch-a': HIMALAYAN_GALLERY,
  'batch-b': HIMALAYAN_GALLERY,
  'batch-d': UDAIPUR_GALLERY,
  'batch-e': UDAIPUR_GALLERY,
}

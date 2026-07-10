import type { ComponentType } from 'react'
import {
  BatchAFullVisual,
  BatchASlideBonfire,
  BatchASlideKasol,
  BatchASlideManali,
  BatchASlideSissu,
  BatchBFullVisual,
  BatchBSlideFireside,
  BatchBSlideRetreat,
  BatchBSlideSummit,
  BatchBSlideValley,
} from '@/components/batches/BatchVisuals'

export type BatchGallerySlide = {
  id: string
  caption: string
  Visual: ComponentType
}

export const BATCH_GALLERY: Record<string, BatchGallerySlide[]> = {
  'batch-a': [
    { id: 'overview', caption: 'Manali · Kasol · Sissu — 5N/6D', Visual: BatchAFullVisual },
    { id: 'manali', caption: 'Manali — first impressions & chai at dawn', Visual: BatchASlideManali },
    { id: 'kasol', caption: 'Kasol — riverside walks & real conversation', Visual: BatchASlideKasol },
    { id: 'bonfire', caption: 'Bonfire nights — ice breakers that actually work', Visual: BatchASlideBonfire },
    { id: 'sissu', caption: 'Sissu — snow peaks & the views that change you', Visual: BatchASlideSissu },
  ],
  'batch-b': [
    { id: 'overview', caption: 'Dusk · Kasol · Two strangers under the same sky', Visual: BatchBFullVisual },
    { id: 'retreat', caption: 'Premium stays — space to breathe and be seen', Visual: BatchBSlideRetreat },
    { id: 'valley', caption: 'Parvati Valley — golden hour, no phones', Visual: BatchBSlideValley },
    { id: 'fireside', caption: 'Fireside circles — depth over small talk', Visual: BatchBSlideFireside },
    { id: 'summit', caption: 'Summit mornings — clarity at 3,000 metres', Visual: BatchBSlideSummit },
  ],
  'batch-d': [
    { id: 'overview', caption: 'Udaipur · Kumbhalgarh — 2N/3D', Visual: BatchAFullVisual },
    { id: 'party', caption: 'Night 1 — hosted Bollywood house party', Visual: BatchASlideBonfire },
    { id: 'fatehsagar', caption: 'Fatehsagar Lake sunset & street-food market', Visual: BatchASlideManali },
    { id: 'palace', caption: 'City Palace, ghats & lake-view cafés', Visual: BatchASlideKasol },
    { id: 'kumbhalgarh', caption: 'Kumbhalgarh Fort — 38 km of UNESCO walls', Visual: BatchASlideSissu },
  ],
  'batch-e': [
    { id: 'overview', caption: 'Udaipur · Kumbhalgarh — 2N/3D', Visual: BatchBFullVisual },
    { id: 'party', caption: 'Night 1 — hosted Bollywood house party', Visual: BatchBSlideFireside },
    { id: 'lake', caption: 'Fatehsagar Lake and Gangaur Ghat', Visual: BatchBSlideValley },
    { id: 'palace', caption: 'City Palace, temples & old-city cafés', Visual: BatchBSlideRetreat },
    { id: 'kumbhalgarh', caption: 'Kumbhalgarh Fort — views that change you', Visual: BatchBSlideSummit },
  ],
}

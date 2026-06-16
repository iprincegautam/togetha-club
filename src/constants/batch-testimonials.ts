/** Drop MP4 files in public/videos/{slug}/ — e.g. public/videos/batch-a/01.mp4 */
export type BatchVideoTestimonial = {
  id: string
  title: string
  subtitle: string
  src: string
  poster?: string
}

export const BATCH_VIDEO_TESTIMONIALS: Record<string, BatchVideoTestimonial[]> = {
  'batch-a': [
    {
      id: 'a-1',
      title: 'Ananya',
      subtitle: 'Content creator and Dancer · Kolkata',
      src: '/videos/batch-a/01.mp4',
      poster: '/videos/batch-a/01-poster.jpg',
    },
    {
      id: 'a-2',
      title: 'Shrutika',
      subtitle: 'Digital Marketer · Delhi',
      src: '/videos/batch-a/02.mp4',
      poster: '/videos/batch-a/02-poster.jpg',
    },
    {
      id: 'a-3',
      title: 'Bhumi',
      subtitle: 'Software Engineer · Bangalore',
      src: '/videos/batch-a/03.mp4',
      poster: '/videos/batch-a/03-poster.jpg',
    },
  ],
  'batch-b': [
    {
      id: 'b-1',
      title: 'Priya R.',
      subtitle: 'Batch B · Pune',
      src: '/videos/batch-b/01.mp4',
      poster: '/videos/batch-b/01-poster.jpg',
    },
    {
      id: 'b-2',
      title: 'Abhishek M.',
      subtitle: 'Batch B · Delhi',
      src: '/videos/batch-b/02.mp4',
      poster: '/videos/batch-b/02-poster.jpg',
    },
    {
      id: 'b-3',
      title: 'Neha K.',
      subtitle: 'Batch B · Mumbai',
      src: '/videos/batch-b/03.mp4',
      poster: '/videos/batch-b/03-poster.jpg',
    },
  ],
  'batch-c': [
    {
      id: 'c-1',
      title: 'Early waitlist',
      subtitle: 'Coming August 2026',
      src: '/videos/batch-c/01.mp4',
    },
    {
      id: 'c-2',
      title: 'Pilot stories',
      subtitle: 'Togetha.Club',
      src: '/videos/batch-c/02.mp4',
    },
    {
      id: 'c-3',
      title: 'The vibe',
      subtitle: 'Mountains · Connection',
      src: '/videos/batch-c/03.mp4',
    },
  ],
}

export function getBatchVideoTestimonials(slug: string): BatchVideoTestimonial[] {
  return BATCH_VIDEO_TESTIMONIALS[slug] ?? BATCH_VIDEO_TESTIMONIALS['batch-a']
}

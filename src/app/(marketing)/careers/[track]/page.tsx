import { redirect } from 'next/navigation'
import { isInternTrackSlug } from '@/content/careers/roles'
import { ROUTES } from '@/constants/routes'

type PageProps = {
  params: Promise<{ track: string }>
}

/** Legacy / deep links → main careers page with role accordion open */
export default async function CareersTrackRedirectPage({ params }: PageProps) {
  const { track } = await params

  if (isInternTrackSlug(track)) {
    redirect(`${ROUTES.careers}?role=${track}`)
  }

  redirect(ROUTES.careers)
}

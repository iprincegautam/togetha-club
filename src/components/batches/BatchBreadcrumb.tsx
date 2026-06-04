import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

type BatchBreadcrumbProps = {
  label: string
}

export default function BatchBreadcrumb({ label }: BatchBreadcrumbProps) {
  return (
    <nav className="batch-breadcrumb" aria-label="Breadcrumb">
      <Link href={ROUTES.batches}>Batches</Link>
      <span className="batch-breadcrumb-sep" aria-hidden>
        ›
      </span>
      <span className="batch-breadcrumb-current">{label}</span>
    </nav>
  )
}

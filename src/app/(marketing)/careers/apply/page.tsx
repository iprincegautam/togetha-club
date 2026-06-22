import Link from 'next/link'
import { Suspense } from 'react'
import InternApplicationForm from '@/components/careers/InternApplicationForm'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'
import '@/components/apply/apply.css'

export function generateMetadata() {
  return buildMetadata(
    'Apply — Join the Team | Togetha.Club',
    'Apply for a founding role at Togetha.Club — Visual Architect, Motion Storyteller, Member Experience Lead, or Voice Architect.'
  )
}

function ApplyFormFallback() {
  return (
    <div className="apply-card">
      <p className="apply-sub" style={{ marginBottom: 0 }}>
        Loading form…
      </p>
    </div>
  )
}

export default function CareersApplyPage() {
  return (
    <div className="apply-page">
      <div className="apply-shell" style={{ maxWidth: 520 }}>
        <p className="apply-eyebrow">✦ Join the Team ✦</p>
        <h1 className="apply-title">Apply</h1>
        <p className="apply-sub">
          2nd- and 3rd-year college students only. After you submit, check your email for written
          questions and a 3-hour take-home assignment.
        </p>

        <Suspense fallback={<ApplyFormFallback />}>
          <InternApplicationForm />
        </Suspense>

        <p className="apply-foot">
          <Link href={ROUTES.careers} style={{ color: 'var(--teal-stamp)' }}>
            ← Back to careers
          </Link>
        </p>
      </div>
    </div>
  )
}

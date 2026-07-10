'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type ApplyForm from '@/components/apply/ApplyForm'

const ApplyFormClient = dynamic(() => import('@/components/apply/ApplyForm'), {
  ssr: false,
  loading: () => <p className="apply-loading">Loading your application…</p>,
})

type Props = ComponentProps<typeof ApplyForm>

export default function ApplyFormLoader(props: Props) {
  return <ApplyFormClient {...props} />
}

'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import { isPortalPath } from '@/lib/portal-path'

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const portal = isPortalPath(pathname)

  return (
    <>
      {!portal && <Nav />}
      <main className={portal ? 'site-main site-main--portal' : 'site-main'}>{children}</main>
      {!portal && <Footer />}
    </>
  )
}

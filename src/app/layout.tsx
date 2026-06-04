import '@/lib/env'
import type { Metadata } from 'next'
import {
  Playfair_Display,
  Caveat,
  Libre_Baskerville,
  DM_Sans,
} from 'next/font/google'
import SiteChrome from '@/components/layout/SiteChrome'
import SiteMotion from '@/components/layout/SiteMotion'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_URL } from '@/lib/metadata'
import './globals.css'
import '@/styles/motion.css'
import '@/components/home/home.css'
import '@/components/batches/batches.css'
import '@/components/apply/apply.css'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-playfair-display',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-caveat',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: 'Togetha.Club',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${caveat.variable} ${libreBaskerville.variable} ${dmSans.variable}`}
    >
      <body>
        <SiteChrome>
          <SiteMotion>{children}</SiteMotion>
        </SiteChrome>
      </body>
    </html>
  )
}

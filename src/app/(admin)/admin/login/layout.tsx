import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Admin Sign In — Togetha.Club', 'Team access only.')
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

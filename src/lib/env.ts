const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
]

const optional = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RESEND_API_KEY',
]

required.forEach((key) => {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`)
})

if (process.env.NODE_ENV === 'production') {
  optional.forEach((key) => {
    if (!process.env[key]) {
      console.warn(`[env] Missing optional for production: ${key}`)
    }
  })
}

export { isDevelopment } from '@/lib/is-dev'

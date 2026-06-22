import { NextResponse } from 'next/server'
import {
  notifyTeamOfInternApplication,
  sendInternApplicationConfirmation,
  sendInternAssignmentEmail,
} from '@/lib/careers-email'
import { isInternTrackSlug } from '@/content/careers/roles'
import { isDevelopment } from '@/lib/is-dev'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

const MAX_RESUME_BYTES = 5 * 1024 * 1024
const ALLOWED_RESUME_TYPES = ['application/pdf']

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()

    const fullName = String(form.get('fullName') ?? '').trim()
    const email = normalizeEmail(String(form.get('email') ?? ''))
    const phone = String(form.get('phone') ?? '').trim() || null
    const college = String(form.get('college') ?? '').trim()
    const course = String(form.get('course') ?? '').trim() || null
    const yearOfStudy = String(form.get('yearOfStudy') ?? '').trim()
    const trackRaw = String(form.get('track') ?? '').trim()
    const portfolioUrl = String(form.get('portfolioUrl') ?? '').trim()
    const whyTogetha = String(form.get('whyTogetha') ?? '').trim() || null
    const resumeFile = form.get('resume')

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!college) {
      return NextResponse.json({ error: 'College name is required' }, { status: 400 })
    }

    if (yearOfStudy !== '2nd' && yearOfStudy !== '3rd') {
      return NextResponse.json(
        { error: 'This internship is open to 2nd- and 3rd-year students only' },
        { status: 400 }
      )
    }

    if (!isInternTrackSlug(trackRaw)) {
      return NextResponse.json({ error: 'Please select a valid track' }, { status: 400 })
    }

    const track = trackRaw

    if (!portfolioUrl || !portfolioUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Portfolio link is required (Behance, Instagram, Drive, etc.)' },
        { status: 400 }
      )
    }

    if (!(resumeFile instanceof File) || resumeFile.size === 0) {
      return NextResponse.json({ error: 'Resume PDF is required' }, { status: 400 })
    }

    if (!ALLOWED_RESUME_TYPES.includes(resumeFile.type)) {
      return NextResponse.json({ error: 'Resume must be a PDF file' }, { status: 400 })
    }

    if (resumeFile.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'Resume must be under 5MB' }, { status: 400 })
    }

    const supabase = tryCreateServiceRoleClient()
    if (!supabase) {
      if (isDevelopment()) {
        return NextResponse.json({ success: true, dev: true })
      }
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { data: existing } = await supabase
      .from('intern_applications')
      .select('id')
      .eq('email', email)
      .eq('track', track)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        {
          error: 'You have already applied for this track. Check your email for assignment instructions.',
        },
        { status: 409 }
      )
    }

    const applicationId = crypto.randomUUID()
    const resumePath = `${track}/${applicationId}.pdf`
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('intern-resumes')
      .upload(resumePath, resumeBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('[POST /api/careers/apply] resume upload', uploadError.message)
      return NextResponse.json(
        {
          error:
            'Resume upload failed. Ensure the Supabase Storage bucket "intern-resumes" exists (private), then try again.',
        },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()

    const { error: insertError } = await supabase.from('intern_applications').insert({
      id: applicationId,
      full_name: fullName,
      email,
      phone,
      college,
      course,
      year_of_study: yearOfStudy,
      track,
      portfolio_url: portfolioUrl,
      why_togetha: whyTogetha,
      resume_storage_path: resumePath,
      status: 'assignment_sent',
      assignment_sent_at: now,
    })

    if (insertError) {
      console.error('[POST /api/careers/apply] insert', insertError.message)
      await supabase.storage.from('intern-resumes').remove([resumePath])
      if (
        insertError.message.includes('intern_applications') ||
        insertError.message.includes('intern_applications_track_check')
      ) {
        return NextResponse.json(
          {
            error:
              'Applications database needs an update. Run migrations 029–031 in Supabase SQL Editor (supabase/migrations/) — especially 031 for new role slugs.',
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: 'Could not save application' }, { status: 500 })
    }

    await sendInternApplicationConfirmation({ to: email, fullName, track })

    const emailResult = await sendInternAssignmentEmail({ to: email, fullName, track })
    if (!emailResult.ok) {
      console.warn('[POST /api/careers/apply] assignment email failed:', emailResult.error)
    }

    await notifyTeamOfInternApplication({
      fullName,
      email,
      track,
      college,
      yearOfStudy,
      portfolioUrl,
    })

    return NextResponse.json({ success: true, assignmentEmailSent: emailResult.ok })
  } catch (err) {
    console.error('[POST /api/careers/apply]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

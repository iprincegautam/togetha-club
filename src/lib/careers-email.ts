import { TAKE_HOME_ASSIGNMENTS } from '@/content/careers/assignments'
import { CAREERS_PROGRAM, TOGETHA_BRAND_CHEATSHEET } from '@/content/careers/program'
import { getWrittenQuestionsForTrack } from '@/content/careers/questions'
import { CAREERS_ROLES } from '@/content/careers/roles'
import type { InternTrackSlug } from '@/content/careers/types'
import { resend, isResendConfigured } from '@/lib/resend'

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'

function assignmentSection(track: InternTrackSlug): string {
  const assignment = TAKE_HOME_ASSIGNMENTS[track]
  const parts = assignment.parts
    .map(
      (p) =>
        `${p.title}\n${p.instructions}`
    )
    .join('\n\n')

  const rubric = assignment.rubric
    .map((r) => `- ${r.criterion}: ${r.weight}%`)
    .join('\n')

  let extra = ''

  return `TAKE-HOME ASSIGNMENT (${assignment.timeLimitHours}-hour limit — please do not exceed this)

Deliverable: ${assignment.deliverable}

${parts}
${extra}

How we grade (rubric):
${rubric}`
}

function writtenQuestionsSection(track: InternTrackSlug): string {
  const questions = getWrittenQuestionsForTrack(track)
  return questions
    .map((q, i) => `Question ${i + 1}\n${q.prompt}`)
    .join('\n\n')
}

export function buildInternAssignmentEmailText(opts: {
  fullName: string
  track: InternTrackSlug
}): { subject: string; text: string } {
  const role = CAREERS_ROLES[opts.track]
  const firstName = opts.fullName.trim().split(/\s+/)[0] || 'there'

  const text = `Hi ${firstName},

Thank you for applying to the Togetha.Club founding team internship — ${role.title} track.

Our process is about getting to know the person behind the resume. As a next step, please send us your written responses and take-home assignment.

---

ABOUT TOGETHA (read before you start)

${TOGETHA_BRAND_CHEATSHEET.oneLiner}

What we are NOT: ${TOGETHA_BRAND_CHEATSHEET.notThis.join('; ')}.

${TOGETHA_BRAND_CHEATSHEET.isThis}

Funnel: ${TOGETHA_BRAND_CHEATSHEET.funnel}

Useful links:
- About: ${siteUrl()}/about
- Batches: ${siteUrl()}/batches
- Quiz: ${siteUrl()}/match

---

SECTION 1 — WRITTEN RESPONSES

Instructions: Answer each question in plain language. No trick questions. We value clarity over length — aim for 100–200 words per answer.

${writtenQuestionsSection(opts.track)}

---

SECTION 2 — ${assignmentSection(opts.track)}

---

HOW TO SUBMIT

Reply to this email within ${CAREERS_PROGRAM.assignmentDeadlineHours} hours with:
- Subject line: [${role.title}] — ${opts.fullName} — Assignment
- Format: PDF or Google Doc link (video track: add Drive link for MP4)

If you are selected for a working session, we offer a ₹${CAREERS_PROGRAM.assignmentHonorariumInr.toLocaleString('en-IN')} honorarium for completing the assignment in good faith.

We read every response carefully.

— Togetha.Club
${CAREERS_PROGRAM.hiringEmail}`

  return {
    subject: `Next step — Togetha founding team internship (${role.title})`,
    text,
  }
}

export async function sendInternAssignmentEmail(opts: {
  to: string
  fullName: string
  track: InternTrackSlug
}): Promise<{ ok: boolean; error?: string }> {
  if (!isResendConfigured() || !resend) {
    console.warn('[sendInternAssignmentEmail] RESEND_API_KEY not configured')
    return { ok: false, error: 'Email not configured' }
  }

  const { subject, text } = buildInternAssignmentEmailText(opts)

  try {
    await resend.emails.send({
      from: 'Togetha.Club <hello@togetha.club>',
      to: opts.to,
      replyTo: CAREERS_PROGRAM.hiringEmail,
      subject,
      text,
    })
    return { ok: true }
  } catch (err) {
    console.error('[sendInternAssignmentEmail]', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Send failed' }
  }
}

export async function sendInternApplicationConfirmation(opts: {
  to: string
  fullName: string
  track: InternTrackSlug
}): Promise<void> {
  if (!isResendConfigured() || !resend) return

  const role = CAREERS_ROLES[opts.track]
  const firstName = opts.fullName.trim().split(/\s+/)[0] || 'there'

  await resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject: `✦ Application received — ${role.title} internship`,
    text: `Hi ${firstName},

We received your application for the Togetha.Club founding team internship (${role.title}).

You will receive a separate email shortly with written questions and your take-home assignment. Check spam if you do not see it within 10 minutes.

— Togetha.Club`,
  })
}

export async function notifyTeamOfInternApplication(opts: {
  fullName: string
  email: string
  track: InternTrackSlug
  college: string
  yearOfStudy: string
  portfolioUrl: string
}): Promise<void> {
  if (!isResendConfigured() || !resend) return

  const role = CAREERS_ROLES[opts.track]
  const notifyTo = process.env.CAREERS_NOTIFY_EMAIL || CAREERS_PROGRAM.hiringEmail

  await resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: notifyTo,
    subject: `New intern application — ${role.title} — ${opts.fullName}`,
    text: `New founding team internship application

Track: ${role.title}
Name: ${opts.fullName}
Email: ${opts.email}
College: ${opts.college}
Year: ${opts.yearOfStudy}
Portfolio: ${opts.portfolioUrl}

Review in Supabase → intern_applications`,
  })
}

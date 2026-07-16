import { renderTripDetailsHtml, renderTripDetailsText } from '@/lib/batch-trip-email'
import type { CohortTeaserPerson } from '@/lib/match-cohort-preview'
import {
  buildMetaphorEmailBlock,
  buildMountainsEmailBlock,
} from '@/lib/nurture/tease'
import { NURTURE_V2_MAX_STEP } from '@/lib/nurture/constants'
import type { NurtureEmailContent, NurtureEmailContext } from '@/lib/nurture/types'

const AVATAR_COLORS: Record<CohortTeaserPerson['avatarClass'], string> = {
  'av-teal': '#1a6b5a',
  'av-rose': '#b84a62',
  'av-gold': '#b8860b',
}

function wrapHtml(body: string, ctx: NurtureEmailContext): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5edd8;font-family:Georgia,serif;color:#2c1810;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fffef9;border:2px solid #2c1810;border-radius:4px;padding:28px 24px;box-shadow:4px 4px 0 #2c1810;">
      ${body}
      <p style="margin:28px 0 0;font-size:13px;color:#6b5344;font-style:italic;">— Togetha.Club</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#6b5344;margin-top:16px;">
      <a href="${ctx.unsubscribeUrl}" style="color:#1a6b5a;">Unsubscribe</a>
      · Reply with questions anytime
    </p>
  </div>
</body>
</html>`
}

function ctaButton(ctx: NurtureEmailContext, label: string): string {
  return `<p style="margin:24px 0 0;text-align:center;">
  <a href="${ctx.unlockUrl}" style="display:inline-block;background:#1a6b5a;color:#f5edd8;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:3px;border:2px solid #2c1810;box-shadow:3px 3px 0 #2c1810;">${label}</a>
</p>`
}

function urgencyBanner(ctx: NurtureEmailContext): string {
  if (!ctx.departure.urgencyPrefix) return ''
  const dark = ctx.departure.tone === 'hard'
  return `<div style="background:${dark ? '#2c1810' : '#f5edd8'};color:${dark ? '#f5edd8' : '#2c1810'};padding:12px 16px;margin:0 0 18px;border-radius:3px;border-left:3px solid #1a6b5a;font-size:14px;font-weight:bold;line-height:1.5;">${ctx.departure.urgencyPrefix}</div>`
}

function fitLine(ctx: NurtureEmailContext): string {
  return ctx.fitTier === 'strong'
    ? `You're a strong fit for ${ctx.batchLabel} (${ctx.batchAgeRange}) — ${ctx.matchScore}% match.`
    : `You're a solid fit for ${ctx.batchLabel} (${ctx.batchAgeRange}) — ${ctx.matchScore}% match.`
}

function peerLine(ctx: NurtureEmailContext): string {
  return `You're a ${ctx.peerArchetype} type — most likely to click with people who want ${ctx.peerTagline}.`
}

function fomoBlock(ctx: NurtureEmailContext): string {
  return `<p style="font-size:15px;line-height:1.65;background:#f5edd8;padding:14px;border-left:3px solid #1a6b5a;margin:18px 0;">${ctx.departure.fomoLine}</p>`
}

function renderCohortPersonCard(person: CohortTeaserPerson): string {
  const bg = AVATAR_COLORS[person.avatarClass]
  return `<div style="border:1px solid #e8dcc8;border-radius:4px;padding:12px 14px;margin:0 0 10px;display:flex;gap:12px;align-items:flex-start;">
    <div style="width:36px;height:36px;border-radius:50%;background:${bg};color:#fff;font-family:system-ui,sans-serif;font-weight:700;font-size:15px;line-height:36px;text-align:center;flex-shrink:0;">${person.displayName.charAt(0)}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:14px;font-weight:bold;filter:blur(4px);">${person.displayName}</div>
      <div style="font-size:13px;color:#2c1810;margin-top:2px;">${person.role}</div>
      <div style="font-size:12px;color:#6b5344;filter:blur(3px);">${person.orgLine}</div>
      <div style="font-size:12px;color:#1a6b5a;margin-top:6px;font-style:italic;">${person.vibeLabel}</div>
    </div>
    <div style="font-size:14px;opacity:0.7;">🔒</div>
  </div>`
}

function renderCohortBlock(ctx: NurtureEmailContext): { html: string; text: string } {
  const { cohort, departure } = ctx
  const dateRef = departure.isPassed
    ? departure.pivotLabel ?? departure.effectiveLabel
    : departure.effectiveLabel ?? departure.label

  const headline =
    departure.tier === 'critical'
      ? `${cohort.likeYouCount} people like you are already confirmed${dateRef ? ` for ${dateRef}` : ''} — you're not one of them yet.`
      : departure.isPassed
        ? `The batch you picked has left. On ${dateRef ?? ctx.batchLabel}, our AI found ${cohort.likeYouCount} people like you already confirmed.`
        : `On ${ctx.batchLabel}, our AI found ${cohort.likeYouCount} people like you.`

  const cardsHtml = cohort.people.map(renderCohortPersonCard).join('')
  const moreLine =
    cohort.moreHiddenCount > 0
      ? `<p style="font-size:13px;color:#6b5344;font-style:italic;margin:8px 0 0;">+ ${cohort.moreHiddenCount} more profiles like yours — unlock after you book.</p>`
      : ''

  const html = `<p style="font-size:11px;font-family:system-ui,sans-serif;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1a6b5a;margin:0 0 8px;">✦ People already in your lane</p>
    <p style="font-size:16px;line-height:1.55;font-weight:bold;margin:0 0 12px;">${headline}</p>
    <p style="font-size:14px;line-height:1.6;color:#6b5344;margin:0 0 16px;">Same vibe. Similar values. Already booked — identities stay hidden until departure day.</p>
    ${cardsHtml}
    ${moreLine}
    <p style="font-size:13px;color:#2c1810;margin:14px 0 0;"><strong>${cohort.urgencyLine}</strong></p>`

  const peopleText = cohort.people
    .map((p) => `• ${p.displayName} — ${p.role} — ${p.vibeLabel} 🔒`)
    .join('\n')

  const text = `${headline}

Same vibe. Similar values. Already booked — identities stay hidden until departure day.

${peopleText}
${cohort.moreHiddenCount > 0 ? `\n+ ${cohort.moreHiddenCount} more profiles like yours — unlock after you book.` : ''}

${cohort.urgencyLine}`

  return { html, text }
}

function quizMirrorBlock(ctx: NurtureEmailContext): { opener: string; body: string } {
  if (ctx.mountains.state !== 'skipped') {
    return buildMountainsEmailBlock(ctx.mountains.state, ctx.mountains.raw, ctx.quizAnswers)
  }
  if (ctx.metaphor.state !== 'skipped') {
    return buildMetaphorEmailBlock(ctx.metaphor.state, ctx.metaphor.raw, ctx.peerArchetype)
  }
  return buildMountainsEmailBlock('skipped', '', ctx.quizAnswers)
}

function subjectWithUrgency(ctx: NurtureEmailContext, base: string, criticalBase?: string): string {
  if (ctx.departure.tier === 'critical' && criticalBase) return criticalBase
  if (ctx.departure.tier === 'passed' && ctx.departure.pivotLabel) {
    return `${ctx.firstName}, your saved date passed — next Friday is ${ctx.departure.pivotLabel.split(',')[0]?.trim() ?? 'open'}`
  }
  return base
}

export function renderNurtureEmail(step: number, ctx: NurtureEmailContext): NurtureEmailContent {
  if (step >= 1 && step <= NURTURE_V2_MAX_STEP) {
    switch (step) {
      case 1:
        return email1(ctx)
      case 2:
        return email2(ctx)
      case 3:
        return email3(ctx)
      case 4:
        return email4(ctx)
      case 5:
        return email5(ctx)
      case 6:
        return email6(ctx)
    }
  }

  return renderLegacyEmail(step, ctx)
}

/** Legacy v1 steps 1–5 (metaphor on E2, mountains on E3). */
function renderLegacyEmail(step: number, ctx: NurtureEmailContext): NurtureEmailContent {
  switch (step) {
    case 1:
      return email1(ctx)
    case 2: {
      const block = buildMetaphorEmailBlock(ctx.metaphor.state, ctx.metaphor.raw, ctx.peerArchetype)
      const subject =
        ctx.metaphor.state === 'skipped'
          ? `Someone on your trip thinks like you — unlock to see`
          : `${ctx.firstName}, someone answered almost the same way you did`
      const text = `Hi ${ctx.firstName},\n\n${block.opener}\n\n${block.body}\n\n${ctx.departure.fomoLine}\n\n→ ${ctx.departure.ctaDateLine}: ${ctx.unlockUrl}\n\n— Togetha.Club\nUnsubscribe: ${ctx.unsubscribeUrl}`
      const html = wrapHtml(
        `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
        ${urgencyBanner(ctx)}
        <p style="font-size:15px;line-height:1.65;font-weight:bold;">${block.opener}</p>
        <p style="font-size:15px;line-height:1.65;">${block.body}</p>
        ${fomoBlock(ctx)}
        ${ctaButton(ctx, 'Unlock your batch preview →')}`,
        ctx
      )
      return { subject, text, html }
    }
    case 3:
      return email3(ctx)
    case 4:
      return email4(ctx)
    case 5:
      return email6(ctx)
    default:
      throw new Error(`Invalid nurture step: ${step}`)
  }
}

function email1(ctx: NurtureEmailContext): NurtureEmailContent {
  const hasCreative =
    ctx.metaphor.state !== 'skipped' || ctx.mountains.state !== 'skipped'
  const creativeLine = hasCreative
    ? 'We read your quiz — including the answers you wrote in your own words.'
    : 'We read your quiz and saved your compatibility profile.'

  const subject = subjectWithUrgency(
    ctx,
    `${ctx.firstName}, your ${ctx.batchLabel} match is saved`,
    ctx.departure.daysUntil != null
      ? `${ctx.firstName}, ${ctx.departure.daysUntil} day${ctx.departure.daysUntil === 1 ? '' : 's'} left — your batch is closing`
      : `${ctx.firstName}, your batch is closing soon`
  )

  const tripDetailsText = renderTripDetailsText(ctx.batchSlug)
  const tripDetailsHtml = renderTripDetailsHtml(ctx.batchSlug, ctx.batchUrl)

  const text = `Hi ${ctx.firstName},

${creativeLine}

${fitLine(ctx)}
${peerLine(ctx)}

We don't show names, faces, or full matches until you reserve.

${tripDetailsText}

${ctx.departure.fomoLine}

${ctx.vacantBoys} boys · ${ctx.vacantGirls} girls still open on your edition.

→ ${ctx.departure.ctaDateLine}: ${ctx.unlockUrl}

Reserve with ${ctx.depositLabel} deposit · pay the rest once you're approved.

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    ${urgencyBanner(ctx)}
    <p style="font-size:15px;line-height:1.65;">${creativeLine}</p>
    <p style="font-size:15px;line-height:1.65;">${fitLine(ctx)} ${peerLine(ctx)}</p>
    <p style="font-size:15px;line-height:1.65;"><strong>We don't show names, faces, or full matches until you reserve.</strong></p>
    ${tripDetailsHtml}
    ${fomoBlock(ctx)}
    <p style="font-size:14px;color:#6b5344;">${ctx.vacantBoys} boys · ${ctx.vacantGirls} girls still open · deposit ${ctx.depositLabel}</p>
    ${ctaButton(ctx, ctx.departure.ctaDateLine + ' →')}`,
    ctx
  )

  return { subject, text, html }
}

function email2(ctx: NurtureEmailContext): NurtureEmailContent {
  const cohort = renderCohortBlock(ctx)

  const subject = subjectWithUrgency(
    ctx,
    `${ctx.firstName}, ${ctx.cohort.likeYouCount} people like you on ${ctx.batchLabel}`,
    `${ctx.firstName}, ${ctx.cohort.likeYouCount} like you are already in — ${ctx.departure.daysUntil ?? 'few'} days left`
  )

  const text = `Hi ${ctx.firstName},

${cohort.text}

${ctx.departure.fomoLine}

→ ${ctx.departure.ctaDateLine}: ${ctx.unlockUrl}

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    ${urgencyBanner(ctx)}
    ${cohort.html}
    ${fomoBlock(ctx)}
    ${ctaButton(ctx, 'Book your slot →')}`,
    ctx
  )

  return { subject, text, html }
}

function email3(ctx: NurtureEmailContext): NurtureEmailContent {
  const block = quizMirrorBlock(ctx)
  const short = ctx.departure.tier === 'critical'

  const subject =
    ctx.mountains.state !== 'skipped'
      ? subjectWithUrgency(ctx, `That mountains answer — we weighted it heavily`, `${ctx.firstName}, we read your mountains answer — ${ctx.departure.daysUntil ?? 'few'} days left`)
      : subjectWithUrgency(ctx, `${ctx.firstName}, someone on your batch thinks like you`, `${ctx.firstName}, your batch closes in ${ctx.departure.daysUntil ?? 'days'} — still thinking?`)

  const text = `Hi ${ctx.firstName},

${block.opener}

${block.body}

${ctx.departure.fomoLine}

→ ${ctx.departure.ctaDateLine}: ${ctx.unlockUrl}

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    ${urgencyBanner(ctx)}
    <p style="font-size:15px;line-height:1.65;font-weight:bold;">${block.opener}</p>
    <p style="font-size:15px;line-height:1.65;">${short && ctx.departure.tier === 'critical' ? `${block.body.split('.')[0]}.` : block.body}</p>
    ${fomoBlock(ctx)}
    ${ctaButton(ctx, ctx.departure.ctaDateLine + ' →')}`,
    ctx
  )

  return { subject, text, html }
}

function email4(ctx: NurtureEmailContext): NurtureEmailContent {
  const subject = `Why we keep your match preview locked`

  const text = `Hi ${ctx.firstName},

Still thinking? Fair.

We don't show everyone on the batch before you book because browsers don't show up — committed people do.

24 screened singles. 12 boys · 12 girls. Verified IDs. No roses, no eliminations, no cameras.

${ctx.departure.fomoLine}

When you reserve, your match preview unlocks — including who aligns with your profile on that week.

→ ${ctx.departure.ctaDateLine}: ${ctx.unlockUrl}

Watch real travellers: ${ctx.batchUrl}

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    ${urgencyBanner(ctx)}
    <p style="font-size:15px;line-height:1.65;">Still thinking? Fair.</p>
    <p style="font-size:15px;line-height:1.65;">We don't show everyone on the batch before you book because <strong>browsers don't show up — committed people do.</strong></p>
    <p style="font-size:15px;line-height:1.65;">24 screened singles · 12 boys · 12 girls · verified · no roses · no cameras.</p>
    ${fomoBlock(ctx)}
    ${ctaButton(ctx, 'Complete booking →')}
    <p style="margin-top:16px;font-size:13px;text-align:center;"><a href="${ctx.batchUrl}" style="color:#1a6b5a;">See the batch page →</a></p>`,
    ctx
  )

  return { subject, text, html }
}

function email5(ctx: NurtureEmailContext): NurtureEmailContent {
  const dateBit = ctx.departure.effectiveLabel
    ? `Your ${ctx.departure.isPassed ? 'next' : 'saved'} date: ${ctx.departure.effectiveLabel}. `
    : ''

  const subject = subjectWithUrgency(
    ctx,
    `${ctx.firstName}, hold your spot for ${ctx.depositLabel}`,
    `${ctx.firstName}, pay ${ctx.depositLabel} today — batch leaves in ${ctx.departure.daysUntil ?? 'days'}`
  )

  const text = `Hi ${ctx.firstName},

You don't have to pay the full amount today.

Reserve your slot with ${ctx.depositLabel} now. Pay the rest once you're approved. EMI available on checkout.

What's included:
• Delhi to Delhi transport
• 5 nights — Manali, Sissu & Kasol (Delhi overnight out and back)
• All meals, ice breakers, bonfire night
• Trip lead, verification, private group access

${dateBit}${ctx.vacantTotal} spots still open on your edition.

→ Pay ${ctx.depositLabel} & unlock: ${ctx.unlockUrl}

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    ${urgencyBanner(ctx)}
    <p style="font-size:15px;line-height:1.65;">You don't have to pay the full amount today.</p>
    <p style="font-size:15px;line-height:1.65;">Reserve with <strong>${ctx.depositLabel}</strong> now. Pay the rest once you're approved. EMI available at checkout.</p>
    <p style="font-size:14px;line-height:1.65;color:#6b5344;">Delhi-Delhi transport · 5 nights · all meals · bonfire · verified batch · trip lead</p>
    ${fomoBlock(ctx)}
    <p style="font-size:14px;color:#6b5344;">${dateBit}${ctx.vacantTotal} spots still open.</p>
    ${ctaButton(ctx, `Pay ${ctx.depositLabel} deposit & unlock →`)}`,
    ctx
  )

  return { subject, text, html }
}

function email6(ctx: NurtureEmailContext): NurtureEmailContent {
  const dateBit = ctx.departure.effectiveLabel
    ? `Your ${ctx.departure.isPassed ? 'next' : 'saved'} date: ${ctx.departure.effectiveLabel}. `
    : ''

  const subject = subjectWithUrgency(
    ctx,
    ctx.departure.effectiveLabel
      ? `${ctx.firstName}, ${ctx.departure.effectiveLabel} is filling up`
      : `${ctx.firstName}, your preview won't wait forever`,
    ctx.departure.daysUntil === 0
      ? `${ctx.firstName}, final hours — batch leaves today`
      : `${ctx.firstName}, ${ctx.departure.daysUntil ?? 'few'} days left — last note from us`
  )

  const text = `Hi ${ctx.firstName},

Last reminder from us on this sequence.

${dateBit}${ctx.vacantTotal} spots still open on ${ctx.batchLabel}. Your compatibility profile is saved — but we won't hold a match preview indefinitely.

${ctx.cohort.likeYouCount} people like you are already on this batch. You're one deposit away from seeing who.

→ ${ctx.departure.ctaDateLine}: ${ctx.unlockUrl}

If now isn't the right time, no hard feelings. We run a new batch every Friday.

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    ${urgencyBanner(ctx)}
    <p style="font-size:15px;line-height:1.65;font-weight:bold;">Last reminder.</p>
    <p style="font-size:15px;line-height:1.65;">${dateBit}${ctx.vacantTotal} spots still open. Your profile is saved — but the preview won't wait forever.</p>
    <p style="font-size:15px;line-height:1.65;font-style:italic;">${ctx.cohort.likeYouCount} people like you are already on this batch. You're one deposit away from seeing who.</p>
    ${ctaButton(ctx, `${ctx.departure.ctaDateLine} →`)}`,
    ctx
  )

  return { subject, text, html }
}

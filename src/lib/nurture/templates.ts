import {
  buildMetaphorEmailBlock,
  buildMountainsEmailBlock,
} from '@/lib/nurture/tease'
import type { NurtureEmailContent, NurtureEmailContext } from '@/lib/nurture/types'

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

function fitLine(ctx: NurtureEmailContext): string {
  return ctx.fitTier === 'strong'
    ? `You're a strong fit for ${ctx.batchLabel} (${ctx.batchAgeRange}).`
    : `You're a solid fit for ${ctx.batchLabel} (${ctx.batchAgeRange}).`
}

export function renderNurtureEmail(step: number, ctx: NurtureEmailContext): NurtureEmailContent {
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

  const subject = `${ctx.firstName}, your batch preview is ready (locked)`

  const text = `Hi ${ctx.firstName},

${creativeLine}

${fitLine(ctx)} We don't show names, faces, or full matches until you reserve.

${ctx.departure.fomoLine}

${ctx.vacantBoys} boys · ${ctx.vacantGirls} girls still open on your edition.

You're one step away from unlocking who's on your batch.

→ ${ctx.departure.ctaDateLine}: ${ctx.unlockUrl}

Reserve with ${ctx.depositLabel} deposit · balance due before departure.

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    <p style="font-size:15px;line-height:1.65;">${creativeLine}</p>
    <p style="font-size:15px;line-height:1.65;">${fitLine(ctx)} <strong>We don't show names, faces, or full matches until you reserve.</strong></p>
    <p style="font-size:15px;line-height:1.65;background:#f5edd8;padding:14px;border-left:3px solid #1a6b5a;margin:18px 0;">${ctx.departure.fomoLine}</p>
    <p style="font-size:14px;color:#6b5344;">${ctx.vacantBoys} boys · ${ctx.vacantGirls} girls still open · deposit ${ctx.depositLabel}</p>
    <p style="font-size:15px;line-height:1.65;font-style:italic;">You're one step away from unlocking who's on your batch.</p>
    ${ctaButton(ctx, ctx.departure.ctaDateLine + ' →')}`,
    ctx
  )

  return { subject, text, html }
}

function email2(ctx: NurtureEmailContext): NurtureEmailContent {
  const block = buildMetaphorEmailBlock(ctx.metaphor.state, ctx.metaphor.raw, ctx.peerArchetype)
  const subject =
    ctx.metaphor.state === 'skipped'
      ? `Someone on your trip thinks like you — unlock to see`
      : `${ctx.firstName}, someone answered almost the same way you did`

  const text = `Hi ${ctx.firstName},

${block.opener}

${block.body}

${ctx.departure.fomoLine}

You're one step away from seeing your batch match preview.

→ ${ctx.departure.ctaDateLine}: ${ctx.unlockUrl}

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    <p style="font-size:15px;line-height:1.65;font-weight:bold;">${block.opener}</p>
    <p style="font-size:15px;line-height:1.65;">${block.body}</p>
    <p style="font-size:14px;line-height:1.65;background:#f5edd8;padding:14px;margin:18px 0;">${ctx.departure.fomoLine}</p>
    <p style="font-size:15px;font-style:italic;">You're one step away from seeing your batch match preview.</p>
    ${ctaButton(ctx, 'Unlock your batch preview →')}`,
    ctx
  )

  return { subject, text, html }
}

function email3(ctx: NurtureEmailContext): NurtureEmailContent {
  const block = buildMountainsEmailBlock(ctx.mountains.state, ctx.mountains.raw, ctx.quizAnswers)

  const subject =
    ctx.mountains.state !== 'skipped'
      ? `That mountains answer — we weighted it heavily`
      : `${ctx.firstName}, your batch is still waiting`

  const text = `Hi ${ctx.firstName},

${block.opener}

${block.body}

${ctx.departure.fomoLine}

→ Reserve & unlock: ${ctx.unlockUrl}

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    <p style="font-size:15px;line-height:1.65;font-weight:bold;">${block.opener}</p>
    <p style="font-size:15px;line-height:1.65;">${block.body}</p>
    <p style="font-size:14px;line-height:1.65;background:#f5edd8;padding:14px;margin:18px 0;">${ctx.departure.fomoLine}</p>
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
    <p style="font-size:15px;line-height:1.65;">Still thinking? Fair.</p>
    <p style="font-size:15px;line-height:1.65;">We don't show everyone on the batch before you book because <strong>browsers don't show up — committed people do.</strong></p>
    <p style="font-size:15px;line-height:1.65;">24 screened singles · 12 boys · 12 girls · verified · no roses · no cameras.</p>
    <p style="font-size:14px;line-height:1.65;background:#f5edd8;padding:14px;margin:18px 0;">${ctx.departure.fomoLine}</p>
    <p style="font-size:15px;line-height:1.65;">When you reserve, your match preview unlocks.</p>
    ${ctaButton(ctx, 'Complete booking →')}
    <p style="margin-top:16px;font-size:13px;text-align:center;"><a href="${ctx.batchUrl}" style="color:#1a6b5a;">See the batch page →</a></p>`,
    ctx
  )

  return { subject, text, html }
}

function email5(ctx: NurtureEmailContext): NurtureEmailContent {
  const dateBit =
    ctx.departure.state === 'selected' && ctx.departure.label
      ? `Your saved date: ${ctx.departure.label}. `
      : ''

  const subject =
    ctx.departure.state === 'selected' && ctx.departure.label
      ? `${ctx.firstName}, ${ctx.departure.label} is filling up`
      : `${ctx.firstName}, your preview won't wait forever`

  const text = `Hi ${ctx.firstName},

Last reminder.

${dateBit}${ctx.vacantTotal} spots still open on your edition. Your compatibility profile is saved — but we won't hold a match preview indefinitely.

The person we'd most want you near on day 1? You'll understand why after you reserve.

→ Pay ${ctx.depositLabel} deposit & unlock: ${ctx.unlockUrl}

— Togetha.Club
Unsubscribe: ${ctx.unsubscribeUrl}`

  const html = wrapHtml(
    `<p style="font-size:16px;line-height:1.6;">Hi ${ctx.firstName},</p>
    <p style="font-size:15px;line-height:1.65;font-weight:bold;">Last reminder.</p>
    <p style="font-size:15px;line-height:1.65;">${dateBit}${ctx.vacantTotal} spots still open. Your profile is saved — but the preview won't wait forever.</p>
    <p style="font-size:15px;line-height:1.65;font-style:italic;">The person we'd most want you near on day 1? You'll see why after you reserve.</p>
    ${ctaButton(ctx, `Pay ${ctx.depositLabel} deposit & unlock →`)}`,
    ctx
  )

  return { subject, text, html }
}

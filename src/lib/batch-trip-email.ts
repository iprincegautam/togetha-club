import type { ActivityTag } from '@/components/batches/BatchTabPanels'
import { getBatchTripDetails } from '@/lib/batch-trip-data'
import type { MatchableBatchSlug } from '@/types/match'

function activityText(tag: ActivityTag): string {
  return typeof tag === 'string' ? tag : tag.text
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderTripDetailsText(batchSlug: MatchableBatchSlug): string {
  const { itinerary, includes, notIncluded } = getBatchTripDetails(batchSlug)

  const days = itinerary
    .map((day) => {
      const activities = day.activities.map((activity) => `  • ${activityText(activity)}`).join('\n')
      return `Day ${day.num} — ${day.location}\n${day.title}\n${activities}`
    })
    .join('\n\n')

  const included = includes.map((item) => `• ${item.title}: ${item.desc}`).join('\n')

  let text = `YOUR TRIP ITINERARY (3 NIGHTS · 4 DAYS)\n\n${days}\n\nWHAT'S INCLUDED\n\n${included}`

  if (notIncluded?.length) {
    text += `\n\nNOT INCLUDED\n\n${notIncluded.map((item) => `• ${item}`).join('\n')}`
  }

  return text
}

export function renderTripDetailsHtml(batchSlug: MatchableBatchSlug, _batchUrl: string): string {
  const { itinerary, includes, notIncluded } = getBatchTripDetails(batchSlug)

  const dayBlocks = itinerary
    .map((day) => {
      const activities = day.activities
        .map(
          (activity) =>
            `<li style="margin:0 0 6px;font-size:13px;line-height:1.5;color:#2c1810;">${escapeHtml(activityText(activity))}</li>`
        )
        .join('')

      return `<div style="margin:0 0 16px;padding-bottom:14px;border-bottom:1px solid #e8dcc8;">
        <p style="margin:0 0 4px;font-size:11px;font-family:system-ui,sans-serif;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#1a6b5a;">Day ${day.num} · ${escapeHtml(day.location)}</p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold;line-height:1.4;">${escapeHtml(day.title)}</p>
        <ul style="margin:0;padding-left:18px;">${activities}</ul>
      </div>`
    })
    .join('')

  const includeItems = includes
    .map(
      (item) =>
        `<li style="margin:0 0 10px;font-size:13px;line-height:1.55;color:#2c1810;"><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.desc)}</li>`
    )
    .join('')

  const notIncludedBlock = notIncluded?.length
    ? `<p style="margin:18px 0 8px;font-size:12px;font-family:system-ui,sans-serif;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#6b5344;">Not included</p>
       <ul style="margin:0;padding-left:18px;">${notIncluded
         .map(
           (item) =>
             `<li style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#6b5344;">${escapeHtml(item)}</li>`
         )
         .join('')}</ul>`
    : ''

  return `<div style="margin:24px 0 0;padding:18px 16px;background:#f5edd8;border:1px solid #e8dcc8;border-radius:4px;">
    <p style="margin:0 0 6px;font-size:12px;font-family:system-ui,sans-serif;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#1a6b5a;">Your itinerary · 3 nights / 4 days</p>
    <p style="margin:0 0 16px;font-size:13px;line-height:1.55;color:#6b5344;">Delhi → Manali → Sissu → Kasol → Delhi. Day-by-day plan and inclusions below.</p>
    ${dayBlocks}
    <p style="margin:8px 0 10px;font-size:12px;font-family:system-ui,sans-serif;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#1a6b5a;">What's included</p>
    <ul style="margin:0;padding-left:18px;">${includeItems}</ul>
    ${notIncludedBlock}
  </div>`
}

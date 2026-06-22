#!/usr/bin/env node
/**
 * Build classified_dms.json from an Instagram data-export zip.
 *   node scripts/build-classified-dms-from-instagram-export.mjs [path/to/export.zip] [output.json]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, rmSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const BRAND_HINTS = ['unplanned', 'hinge', 'togetha', 'travelers. by']
const SKIP_HANDLES = ['instagramforbusiness', 'meta', 'facebook']
const SKIP_SENDERS = ['instagram for business', 'meta business', 'facebook']
const SKIP_CONTENT = [
  /^you (missed|started|ended) (an )?(audio|video) call/i,
  /^liked a message$/i,
  /^sent an attachment$/i,
  /^reacted .* to your message$/i,
]

const CATEGORIES = [
  'general_interest',
  'pricing_payment',
  'how_to_join',
  'destination_question',
  'accommodation',
  'payment_failure',
  'frustrated_user',
  'cold_lead',
]

function decodeInstagramText(text) {
  if (!text) return ''
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\u00e2\u0080\u0099/g, "'")
    .replace(/\u00e2\u0080\u009c/g, '"')
    .replace(/\u00e2\u0080\u009d/g, '"')
    .replace(/\u00e2\u0080\u0094/g, '—')
    .replace(/\u00e2\u0080\u0093/g, '–')
    .trim()
}

function isBrandSender(name) {
  const n = (name || '').toLowerCase()
  return BRAND_HINTS.some((hint) => n.includes(hint))
}

function handleFromFolder(folderName) {
  const match = folderName.match(/^(.+)_\d+$/)
  return match ? match[1].replace(/_/g, '.') : folderName
}

function shouldSkipMessage(content) {
  if (!content) return true
  return SKIP_CONTENT.some((re) => re.test(content))
}

function classify(rawMessage) {
  const text = rawMessage.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)

  if (
    /payment (fail|error|block)|transaction fail|razorpay|couldn.?t pay|can't pay|not working.*pay|website.*block/.test(
      text
    )
  ) {
    return { category: 'payment_failure', urgency: 'high' }
  }
  if (/frustrated|annoyed|worst|terrible|scam|refund|rude|useless|pathetic|disappoint/.test(text)) {
    return { category: 'frustrated_user', urgency: 'high' }
  }
  if (/price|cost|how much|fee|₹|rs\.?|rupee|payment link|pay now|installment|budget/.test(text)) {
    return { category: 'pricing_payment', urgency: 'medium' }
  }
  if (/how (to|do i)|join|sign up|signup|apply|register|process|eligible|solo|couple|who can/.test(text)) {
    return { category: 'how_to_join', urgency: 'medium' }
  }
  if (/room|stay|hotel|accommodation|sharing|T\s?&\s?C|twin|single room|where will we stay/.test(text)) {
    return { category: 'accommodation', urgency: 'low' }
  }
  if (
    /where|destination|batch|trip|travel|goa|bali|spiti|manali|ladakh|itinerary|dates|when is|which batch/.test(
      text
    )
  ) {
    return { category: 'destination_question', urgency: 'medium' }
  }
  if (words.length <= 3 && /^(hi|hey|hello|hii|yo|sup|ok|okay|thanks|thank you|yes|no)[!.?]*$/i.test(text)) {
    return { category: 'cold_lead', urgency: 'low' }
  }
  return { category: 'general_interest', urgency: 'low' }
}

function oneLineSummary(message, category) {
  const trimmed = message.replace(/\s+/g, ' ').slice(0, 90)
  return `[${category}] ${trimmed}`
}

function extractPairs(thread) {
  const participants = thread.participants || []
  const brandNames = new Set(
    participants.filter((p) => isBrandSender(p.name)).map((p) => p.name)
  )
  if (brandNames.size === 0) {
    for (const p of participants) {
      if (!isBrandSender(p.name)) continue
      brandNames.add(p.name)
    }
  }

  const userNames = new Set(
    participants.filter((p) => !isBrandSender(p.name)).map((p) => p.name)
  )
  if (userNames.size === 0 || brandNames.size === 0) return []

  const sorted = [...(thread.messages || [])].sort(
    (a, b) => (a.timestamp_ms || 0) - (b.timestamp_ms || 0)
  )

  const pairs = []

  for (let i = 0; i < sorted.length; i += 1) {
    const msg = sorted[i]
    const content = decodeInstagramText(msg.content)
    if (!userNames.has(msg.sender_name)) continue
    if (shouldSkipMessage(content)) continue
    if (content.length < 2) continue

    const replies = []
    for (let j = i + 1; j < sorted.length; j += 1) {
      const next = sorted[j]
      if (userNames.has(next.sender_name)) break
      if (!brandNames.has(next.sender_name)) continue
      const replyText = decodeInstagramText(next.content)
      if (shouldSkipMessage(replyText)) continue
      if (replyText) replies.push(replyText)
      if (replies.length >= 3) break
    }

    if (replies.length === 0) continue

    const losing_response = replies.join('\n').slice(0, 2000)
    const { category, urgency } = classify(content)

    pairs.push({
      sender_name: [...userNames][0] || 'unknown',
      raw_message: content.slice(0, 2000),
      losing_response,
      category,
      urgency,
      one_line_summary: oneLineSummary(content, category),
      dm_received_at: new Date(msg.timestamp_ms || Date.now()).toISOString(),
    })
  }

  return pairs
}

function walkMessageFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walkMessageFiles(full, files)
    } else if (/^message_\d+\.json$/i.test(entry)) {
      files.push(full)
    }
  }
  return files
}

const zipPath = resolve(process.argv[2] || join(process.env.HOME, 'Downloads/instagram-togetha.club-2026-06-20-neLLpxcK.zip'))
const outPath = resolve(process.argv[3] || join(root, 'classified_dms.json'))

if (!existsSync(zipPath)) {
  console.error(`Zip not found: ${zipPath}`)
  process.exit(1)
}

const extractDir = resolve(root, '.tmp/instagram-export')
rmSync(extractDir, { recursive: true, force: true })
mkdirSync(extractDir, { recursive: true })

console.log(`Extracting ${zipPath}...`)
execSync(`unzip -q "${zipPath}" -d "${extractDir}"`)

const inboxRoot = join(extractDir, 'your_instagram_activity/messages/inbox')
if (!existsSync(inboxRoot)) {
  console.error('Expected inbox folder not found in export.')
  process.exit(1)
}

const messageFiles = walkMessageFiles(inboxRoot)
console.log(`Found ${messageFiles.length} conversation files`)

const all = []
const seen = new Set()

for (const file of messageFiles) {
  const folder = dirname(file)
  const folderName = folder.split('/').pop()
  const handle = handleFromFolder(folderName)
  if (SKIP_HANDLES.some((h) => handle.toLowerCase().includes(h))) continue

  const thread = JSON.parse(readFileSync(file, 'utf8'))
  const userParticipant = (thread.participants || []).find((p) => !isBrandSender(p.name))
  if (
    userParticipant &&
    SKIP_SENDERS.some((s) => (userParticipant.name || '').toLowerCase().includes(s))
  ) {
    continue
  }

  for (const pair of extractPairs(thread)) {
    pair.instagram_handle = handle
    const key = `${pair.raw_message}|||${pair.losing_response}`
    if (seen.has(key)) continue
    seen.add(key)
    all.push(pair)
  }
}

all.sort((a, b) => new Date(a.dm_received_at) - new Date(b.dm_received_at))

writeFileSync(outPath, JSON.stringify(all, null, 2), 'utf8')

const byCategory = {}
for (const row of all) {
  byCategory[row.category] = (byCategory[row.category] || 0) + 1
}

console.log(`Wrote ${all.length} classified DMs to ${outPath}`)
console.log('By category:')
for (const cat of CATEGORIES) {
  if (byCategory[cat]) console.log(`  ${cat}: ${byCategory[cat]}`)
}

import { createServiceRoleClient } from '@/lib/supabase/server'

export const DM_LEAD_CATEGORIES = [
  'general_interest',
  'cold_lead',
  'how_to_join',
  'destination_question',
  'pricing_payment',
  'accommodation',
  'payment_failure',
  'frustrated_user',
  'contact_dropped',
  'other',
] as const

export type DMLeadCategory = (typeof DM_LEAD_CATEGORIES)[number]
export type DMLeadUrgency = 'high' | 'medium' | 'low'

export type DMLead = {
  sender_name: string
  instagram_handle?: string
  raw_message: string
  category: DMLeadCategory
  urgency: DMLeadUrgency
  one_line_summary: string
  sophie_replied?: boolean
  sophie_reply?: string
  escalated_to_human?: boolean
  escalation_reason?: string
  dm_received_at?: string
}

export async function logDMToSupabase(lead: DMLead) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('dm_leads')
    .insert([
      {
        ...lead,
        classified_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Failed to log DM to Supabase:', error.message)
    return null
  }

  return data
}

export async function bulkImportClassifiedDMs(filePath: string) {
  const fs = await import('fs')
  const leads: Partial<DMLead>[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const supabase = createServiceRoleClient()

  console.log(`Importing ${leads.length} leads into Supabase...`)

  const batchSize = 50
  let inserted = 0

  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize).map((lead) => ({
      sender_name: lead.sender_name || 'unknown',
      raw_message: lead.raw_message || '',
      category: lead.category,
      urgency: lead.urgency,
      one_line_summary: lead.one_line_summary,
      dm_received_at: lead.dm_received_at || new Date().toISOString(),
      classified_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('dm_leads').insert(batch)

    if (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error.message)
    } else {
      inserted += batch.length
      console.log(`Inserted ${inserted}/${leads.length}`)
    }
  }

  console.log(`Done. ${inserted} leads imported.`)
}

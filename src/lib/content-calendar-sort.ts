type SortableItem = {
  type: string
  dueDate: string | null
  scheduledUploadDate?: string | null
}

const TYPE_ORDER: Record<string, number> = {
  pre_trip: 0,
  daily_story: 1,
  post_trip: 2,
}

/** Announcement first, then daily stories by date, then post-trip. */
export function sortContentItems<T extends SortableItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = TYPE_ORDER[a.type] ?? 1
    const tb = TYPE_ORDER[b.type] ?? 1
    if (ta !== tb) return ta - tb

    const dateA = a.dueDate ?? a.scheduledUploadDate ?? ''
    const dateB = b.dueDate ?? b.scheduledUploadDate ?? ''
    if (dateA && dateB) return dateA.localeCompare(dateB)
    if (dateA) return -1
    if (dateB) return 1
    return 0
  })
}

export function defaultContentSelection<T extends SortableItem>(items: T[]): T | null {
  if (!items.length) return null
  return items.find((i) => i.type === 'pre_trip') ?? items[0]
}

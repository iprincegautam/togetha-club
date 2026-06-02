export type BatchStatus = 'open' | 'sold_out' | 'waitlist' | 'coming_soon'
export type BatchType = 'genz' | 'millennial' | 'mystery'

export interface Batch {
  id: string
  slug: string
  name: string
  batchType: BatchType
  dates: string
  price: number | null
  spotsTotal: number
  spotsTakenM: number
  spotsTakenF: number
  status: BatchStatus
}

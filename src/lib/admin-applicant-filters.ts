import { ROUTES } from '@/constants/routes'

export { resolveApplicantDepartureLabel } from '@/lib/applicant-departure'
import type { ApplicantStatus } from '@/types/applicant'

export type LeadFilter = 'all' | 'quiz_leads' | 'callable'

export type GenderFilter = 'all' | 'm' | 'f'

export type AdminApplicantFilters = {
  status: ApplicantStatus | 'all'
  lead: LeadFilter
  gender: GenderFilter
  name: string
  email: string
  date: string
}

export type AdminApplicantFilterRow = {
  name: string | null
  email: string
  phone: string | null
  gender: 'm' | 'f' | null
  status: ApplicantStatus
  isQuizLead: boolean
  departureLabel: string | null
}

const FILTER_KEYS = ['status', 'lead', 'gender', 'name', 'email', 'date'] as const

const VALID_STATUSES: (ApplicantStatus | 'all')[] = [
  'all',
  'pending',
  'approved',
  'paid',
  'deposit_paid',
  'rejected',
]

const VALID_LEADS: LeadFilter[] = ['all', 'quiz_leads', 'callable']

const VALID_GENDERS: GenderFilter[] = ['all', 'm', 'f']

export const DEFAULT_ADMIN_APPLICANT_FILTERS: AdminApplicantFilters = {
  status: 'all',
  lead: 'all',
  gender: 'all',
  name: '',
  email: '',
  date: '',
}

export function searchParamsToUrlSearchParams(
  sp: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry))
    } else {
      params.set(key, value)
    }
  }
  return params
}

export function parseAdminApplicantFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined>
): AdminApplicantFilters {
  const params =
    input instanceof URLSearchParams ? input : searchParamsToUrlSearchParams(input)

  const statusRaw = params.get('status') ?? 'all'
  const leadRaw = params.get('lead') ?? 'all'
  const genderRaw = params.get('gender') ?? 'all'

  return {
    status: VALID_STATUSES.includes(statusRaw as ApplicantStatus | 'all')
      ? (statusRaw as ApplicantStatus | 'all')
      : 'all',
    lead: VALID_LEADS.includes(leadRaw as LeadFilter) ? (leadRaw as LeadFilter) : 'all',
    gender: VALID_GENDERS.includes(genderRaw as GenderFilter)
      ? (genderRaw as GenderFilter)
      : 'all',
    name: params.get('name')?.trim() ?? '',
    email: params.get('email')?.trim() ?? '',
    date: params.get('date')?.trim() ?? '',
  }
}

export function filtersToSearchParams(filters: AdminApplicantFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.lead !== 'all') params.set('lead', filters.lead)
  if (filters.gender !== 'all') params.set('gender', filters.gender)
  if (filters.name.trim()) params.set('name', filters.name.trim())
  if (filters.email.trim()) params.set('email', filters.email.trim())
  if (filters.date.trim()) params.set('date', filters.date.trim())
  return params
}

export function adminListHref(filters?: Partial<AdminApplicantFilters>): string {
  const merged = { ...DEFAULT_ADMIN_APPLICANT_FILTERS, ...filters }
  const query = filtersToSearchParams(merged).toString()
  return query ? `${ROUTES.admin}?${query}` : ROUTES.admin
}

export function adminApplicantHref(id: string, filters: AdminApplicantFilters): string {
  const query = filtersToSearchParams(filters).toString()
  return query ? `${ROUTES.adminApplicant(id)}?${query}` : ROUTES.adminApplicant(id)
}

export function pickFilterSearchParams(params: URLSearchParams): URLSearchParams {
  const picked = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = params.get(key)
    if (value) picked.set(key, value)
  }
  return picked
}

export function filterAdminApplicants<T extends AdminApplicantFilterRow>(
  applicants: T[],
  filters: AdminApplicantFilters
): T[] {
  let rows = applicants

  if (filters.status !== 'all') {
    rows = rows.filter((row) => row.status === filters.status)
  }

  if (filters.lead === 'quiz_leads') {
    rows = rows.filter((row) => row.isQuizLead)
  } else if (filters.lead === 'callable') {
    rows = rows.filter((row) => Boolean(row.phone))
  }

  if (filters.gender !== 'all') {
    rows = rows.filter((row) => row.gender === filters.gender)
  }

  const nameQ = filters.name.trim().toLowerCase()
  if (nameQ) {
    rows = rows.filter((row) => row.name?.toLowerCase().includes(nameQ))
  }

  const emailQ = filters.email.trim().toLowerCase()
  if (emailQ) {
    rows = rows.filter((row) => row.email.toLowerCase().includes(emailQ))
  }

  const dateQ = filters.date.trim().toLowerCase()
  if (dateQ) {
    rows = rows.filter((row) => row.departureLabel?.toLowerCase().includes(dateQ))
  }

  return rows
}

export function uniqueDepartureLabels(applicants: { departureLabel: string | null }[]): string[] {
  const labels = new Set<string>()
  applicants.forEach((row) => {
    if (row.departureLabel) labels.add(row.departureLabel)
  })
  return Array.from(labels).sort((a, b) => a.localeCompare(b))
}

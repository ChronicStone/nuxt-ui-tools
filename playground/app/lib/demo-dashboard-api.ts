import type { DashboardRemoteOptionsConfig } from '#ui-tools/dashboard'

/**
 * Deterministic mock analytics API for the dashboard playground. Every call resolves after a short
 * random delay so staging, skeletons, and refresh indicators are visible; values only depend on the
 * request, so switching filters back and forth returns identical numbers.
 */

export type DashboardYear = 2024 | 2025 | 2026
export type DashboardCurrency = 'EUR' | 'USD'

export const DASHBOARD_YEARS = [2024, 2025, 2026] as const
export const DASHBOARD_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
export type DashboardMonth = (typeof DASHBOARD_MONTHS)[number]

export const DASHBOARD_PRODUCTS = [
  { label: 'English General', value: 'en-gen', version: 'v4' },
  { label: 'English Business', value: 'en-biz', version: 'v3' },
  { label: 'French General', value: 'fr-gen', version: 'v4' },
  { label: 'Spanish General', value: 'es-gen', version: 'v2' },
  { label: 'German General', value: 'de-gen', version: 'v2' },
  { label: 'Italian General', value: 'it-gen', version: 'v1' },
] as const
export type DashboardProduct = (typeof DASHBOARD_PRODUCTS)[number]['value']

export const DASHBOARD_PRODUCT_PRESETS = [
  { label: 'English range', products: ['en-gen', 'en-biz'] },
  { label: 'Romance languages', products: ['fr-gen', 'es-gen', 'it-gen'] },
  { label: 'Full catalogue', products: DASHBOARD_PRODUCTS.map((product) => product.value) },
] as const satisfies readonly { label: string; products: readonly DashboardProduct[] }[]

const ACCOUNT_NAMES = [
  'Acme Learning',
  'Globex Academy',
  'Initech Formation',
  'Umbrella Langues',
  'Stark Institute',
  'Wayne Education',
  'Hooli Campus',
  'Vandelay Training',
  'Soylent School',
  'Tyrell Language Lab',
  'Cyberdyne Skills',
  'Wonka Academy',
  'Oscorp Learning',
  'Massive Dynamic',
  'Aperture Institute',
  'Black Mesa Training',
  'Gringotts Langues',
  'Monsters Academy',
  'Duff Formation',
  'Pied Piper Campus',
  'Nakatomi Training',
  'Dunder Mifflin Learning',
  'Prestige Worldwide',
  'Sirius Cybernetics',
  'Blue Sun Academy',
  'Virtucon Formation',
  'Kramerica Institute',
  'Bluth Language School',
  'Genco Training',
  'Rekall Campus',
  'Weyland Learning',
  'Zorg Academy',
  'Octan Formation',
  'Spacely Skills',
  'Cogswell Institute',
  'Ollivanders School',
  'Mooby Learning',
  'Paper Street Training',
  'Los Pollos Academy',
  'Buy n Large Campus',
]

export interface DashboardAccount {
  id: string
  name: string
  kind: 'Company' | 'School' | 'Public' | 'Partner'
}

export const DASHBOARD_ACCOUNTS: DashboardAccount[] = ACCOUNT_NAMES.map((name, index) => ({
  id: `acc-${index + 1}`,
  kind: (['Company', 'School', 'Public', 'Partner'] as const)[index % 4] ?? 'Company',
  name,
}))

const YEAR_BASE: Record<DashboardYear, number> = { 2024: 2600, 2025: 3400, 2026: 4200 }
const MONTH_SEASONALITY = [0.78, 0.86, 1.04, 0.97, 1.08, 1.12, 0.74, 0.58, 1.18, 1.21, 1.14, 0.92]
const RATES: Record<DashboardCurrency, number> = { EUR: 1, USD: 1.08 }

function wait<T>(value: T, min = 250, max = 900): Promise<T> {
  const delay = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(() => resolve(value), delay))
}

function hash(input: string) {
  let value = 2166136261
  for (const char of input) value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return (value >>> 0) / 4294967295
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function monthsElapsed(year: DashboardYear) {
  return year === 2026 ? 9 : 12
}

function accountScale(account: string | undefined) {
  return account ? 0.06 + hash(account) * 0.08 : 1
}

function unitsFor(year: DashboardYear, account?: string) {
  const scale = accountScale(account)
  return MONTH_SEASONALITY.slice(0, monthsElapsed(year)).map((seasonality, index) =>
    Math.round(YEAR_BASE[year] * seasonality * scale * (0.92 + hash(`${year}-${index}`) * 0.16)),
  )
}

function previousYear(year: DashboardYear): DashboardYear {
  return year === 2024 ? 2024 : year === 2025 ? 2024 : 2025
}

function marginFor(year: DashboardYear) {
  return MONTH_SEASONALITY.slice(0, monthsElapsed(year)).map(
    (_, index) => Math.round((24 + hash(`margin-${year}-${index}`) * 14) * 10) / 10,
  )
}

export function monthLabel(month: number, locale = 'en') {
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2026, month, 1))
}

// ---------------------------------------------------------------------------
// Consumption tab
// ---------------------------------------------------------------------------

export interface ConsumptionSummary {
  units: number
  unitsPrevious: number
  billed: number
  billedPrevious: number
  margin: number
  marginPrevious: number
  accounts: number
}

export interface ConsumptionMonth {
  month: number
  used: number
  billed: number
  previous: number | null
}

export interface BillingMonth {
  month: number
  billed: number
  margin: number
}

export interface MarginMonth {
  month: number
  margin: number
  previous: number | null
}

export interface ProductShare {
  product: DashboardProduct
  label: string
  version: string
  share: number
}

export interface CountryShare {
  code: string
  name: string
  share: number
}

export interface AccountActivity {
  id: string
  name: string
  kind: string
  change: number
  units: number
}

export type ProductLineMonth = { month: number } & Partial<Record<DashboardProduct, number>>

export const demoDashboardApi = {
  consumption: {
    summary(input: { year: DashboardYear; account?: string; currency: DashboardCurrency }) {
      const units = unitsFor(input.year, input.account)
      const previous = unitsFor(previousYear(input.year), input.account).slice(0, units.length)
      const price = 14.2 * RATES[input.currency]
      const margins = marginFor(input.year)
      const marginsPrevious = marginFor(previousYear(input.year)).slice(0, margins.length)
      return wait<ConsumptionSummary>({
        accounts: input.account
          ? 1
          : Math.round(248 * (input.year === 2026 ? 1 : input.year === 2025 ? 0.86 : 0.7)),
        billed: Math.round(sum(units) * 0.965 * price),
        billedPrevious: Math.round(sum(previous) * 0.965 * price * 0.96),
        margin: sum(margins) / margins.length,
        marginPrevious: sum(marginsPrevious) / marginsPrevious.length,
        units: sum(units),
        unitsPrevious: sum(previous),
      })
    },
    months(input: { year: DashboardYear; account?: string }) {
      const units = unitsFor(input.year, input.account)
      const previous = unitsFor(previousYear(input.year), input.account)
      return wait<ConsumptionMonth[]>(
        MONTH_SEASONALITY.map((_, month) => ({
          billed: Math.round((units[month] ?? 0) * 0.965),
          month,
          previous: input.year === 2024 ? null : (previous[month] ?? null),
          used: units[month] ?? 0,
        })).filter((row) => row.month < monthsElapsed(input.year)),
      )
    },
    billing(input: { year: DashboardYear; account?: string; currency: DashboardCurrency }) {
      const units = unitsFor(input.year, input.account)
      const margins = marginFor(input.year)
      return wait<BillingMonth[]>(
        units.map((value, month) => ({
          billed: Math.round(
            value * 14.2 * RATES[input.currency] * (0.94 + hash(`b-${month}`) * 0.08),
          ),
          margin: margins[month] ?? 0,
          month,
        })),
      )
    },
    adminModes: () =>
      wait([
        { label: 'Online, proctored', share: 46 },
        { label: 'On site', share: 31 },
        { label: 'Online, unproctored', share: 17 },
        { label: 'Paper', share: 6 },
      ]),
    topProducts: (input: { year: DashboardYear }) =>
      wait<ProductShare[]>(
        DASHBOARD_PRODUCTS.map((product, index) => ({
          label: product.label,
          product: product.value,
          share: Math.round(
            ([34, 22, 17, 12, 9, 6][index] ?? 0) + hash(`${input.year}-${product.value}`) * 2,
          ),
          version: product.version,
        })),
      ),
    topCountries: () =>
      wait<CountryShare[]>([
        { code: 'FR', name: 'France', share: 41 },
        { code: 'BE', name: 'Belgium', share: 14 },
        { code: 'CH', name: 'Switzerland', share: 11 },
        { code: 'ES', name: 'Spain', share: 9 },
        { code: 'DE', name: 'Germany', share: 7 },
        { code: 'IT', name: 'Italy', share: 5 },
      ]),
    topAccounts: (input: { year: DashboardYear }) =>
      wait<AccountActivity[]>(
        DASHBOARD_ACCOUNTS.slice(0, 6).map((account, index) => ({
          change: Math.round((hash(`${input.year}-${account.id}`) - 0.3) * 40),
          id: account.id,
          kind: account.kind,
          name: account.name,
          units: Math.round((980 - index * 120) * (YEAR_BASE[input.year] / 4200)),
        })),
      ),
    productLines(input: { year: DashboardYear; products: readonly DashboardProduct[] }) {
      const units = unitsFor(input.year)
      return wait<ProductLineMonth[]>(
        units.map((value, month) => {
          const row: ProductLineMonth = { month }
          for (const product of input.products) {
            const share = DASHBOARD_PRODUCTS.findIndex((entry) => entry.value === product)
            row[product] = Math.round(
              value *
                ([0.34, 0.22, 0.17, 0.12, 0.09, 0.06][share] ?? 0.05) *
                (0.85 + hash(`${product}-${month}`) * 0.3),
            )
          }
          return row
        }),
        400,
        1200,
      )
    },
    accountTypes: () =>
      wait([
        { label: 'Companies', share: 48 },
        { label: 'Schools', share: 27 },
        { label: 'Public bodies', share: 16 },
        { label: 'Partners', share: 9 },
      ]),
    margin(input: { year: DashboardYear }) {
      const current = marginFor(input.year)
      const previous = marginFor(previousYear(input.year))
      return wait<MarginMonth[]>(
        current.map((margin, month) => ({
          margin,
          month,
          previous: input.year === 2024 ? null : (previous[month] ?? null),
        })),
      )
    },
  },

  // -------------------------------------------------------------------------
  // Candidates tab
  // -------------------------------------------------------------------------

  candidates: {
    summary(input: {
      year: DashboardYear
      months: readonly number[]
      accounts: readonly string[]
    }) {
      const scale = scaleFor(input)
      return wait({
        aboveA1: 0.71,
        completion: 0.83,
        completion3: 0.91,
        compromised: 0.021,
        delivered: Math.round(6100 * scale),
        online: Math.round(4300 * scale),
        onsite: Math.round(2750 * scale),
        registered: Math.round(7900 * scale),
        success: 0.78,
      })
    },
    registrations(input: {
      year: DashboardYear
      months: readonly number[]
      accounts: readonly string[]
    }) {
      const scale = scaleFor(input) * (12 / Math.max(1, input.months.length || 12))
      return wait(
        MONTH_SEASONALITY.slice(0, monthsElapsed(input.year)).map((seasonality, month) => ({
          current:
            input.months.length && !input.months.includes(month)
              ? null
              : Math.round(660 * seasonality * scale),
          month,
          previous: Math.round(540 * seasonality * (0.9 + hash(`r-${month}`) * 0.2)),
        })),
      )
    },
    funnel(input: { year: DashboardYear; months: readonly number[]; accounts: readonly string[] }) {
      const registered = Math.round(7900 * scaleFor(input))
      return wait([
        { count: registered, label: 'Registered' },
        { count: Math.round(registered * 0.83), label: 'Exam taken' },
        { count: Math.round(registered * 0.83 * 0.78), label: 'Exam passed' },
        { count: Math.round(registered * 0.83 * 0.78 * 0.96), label: 'Certificate delivered' },
      ])
    },
    perAccount(input: {
      year: DashboardYear
      months: readonly number[]
      accounts: readonly string[]
    }) {
      const accounts = input.accounts.length
        ? DASHBOARD_ACCOUNTS.filter((account) => input.accounts.includes(account.id))
        : DASHBOARD_ACCOUNTS.slice(0, 15)
      const scale = scaleFor({ ...input, accounts: [] })
      return wait(
        accounts.map((account, index) => {
          const registered = Math.round((620 - index * 32) * scale * (0.8 + hash(account.id) * 0.4))
          return {
            delivered: Math.round(registered * (0.62 + hash(`d-${account.id}`) * 0.3)),
            name: account.name,
            registered,
          }
        }),
      )
    },
    proctoring(input: {
      year: DashboardYear
      months: readonly number[]
      accounts: readonly string[]
    }) {
      const scale = scaleFor(input)
      return wait([
        { count: Math.round(2750 * scale), label: 'On site' },
        { count: Math.round(4300 * scale), label: 'Online proctoring' },
      ])
    },
    performance(input: { accounts: readonly string[] }) {
      const accounts = input.accounts.length
        ? DASHBOARD_ACCOUNTS.filter((account) => input.accounts.includes(account.id)).slice(0, 10)
        : DASHBOARD_ACCOUNTS.slice(0, 10)
      return wait(
        accounts.map((account) => ({
          aboveA1: Math.round(55 + hash(`a-${account.id}`) * 35),
          completion: Math.round(70 + hash(`c-${account.id}`) * 26),
          completion3: Math.round(80 + hash(`c3-${account.id}`) * 18),
          name: account.name,
          success: Math.round(62 + hash(`s-${account.id}`) * 30),
        })),
      )
    },
    edof: () =>
      wait([
        { label: 'Validated', share: 58 },
        { label: 'In training', share: 21 },
        { label: 'Service done', share: 13 },
        { label: 'Cancelled', share: 8 },
      ]),
    cefr: () =>
      wait([
        { level: 'A1', share: 9 },
        { level: 'A2', share: 17 },
        { level: 'B1', share: 31 },
        { level: 'B2', share: 26 },
        { level: 'C1', share: 13 },
        { level: 'C2', share: 4 },
      ]),
    delay: () =>
      wait([
        { label: 'Same day', share: 22 },
        { label: '1–7 days', share: 38 },
        { label: '8–15 days', share: 24 },
        { label: '16–30 days', share: 11 },
        { label: 'Over 30 days', share: 5 },
      ]),
  },

  accounts: {
    /** Paginated, searchable account picker source. */
    search(input: { search: string; page: { index: number; size: number } }) {
      const term = input.search.trim().toLowerCase()
      const matches = DASHBOARD_ACCOUNTS.filter((account) =>
        account.name.toLowerCase().includes(term),
      )
      const start = (input.page.index - 1) * input.page.size
      const page = matches.slice(start, start + input.page.size)
      return wait(
        {
          hasMore: start + input.page.size < matches.length,
          options: page.map((account) => ({
            avatar: { text: initials(account.name) },
            description: account.kind,
            label: account.name,
            value: account.id,
          })),
        },
        150,
        450,
      )
    },
    byIds(ids: readonly string[]) {
      return wait(
        DASHBOARD_ACCOUNTS.filter((account) => ids.includes(account.id)).map((account) => ({
          label: account.name,
          value: account.id,
        })),
        100,
        300,
      )
    },
  },
}

/**
 * Remote option source of the demo accounts: searchable, paginated, and able to label ids restored
 * from the URL. `remoteTableOptions()` builds the same shape for a real endpoint.
 */
export const DASHBOARD_ACCOUNT_OPTIONS = {
  load: demoDashboardApi.accounts.search,
  pagination: { size: 12, type: 'page' },
  resolveSelected: ({ values }) => demoDashboardApi.accounts.byIds(values),
  search: { debounce: 200 },
} satisfies DashboardRemoteOptionsConfig

function scaleFor(input: {
  year: DashboardYear
  months: readonly number[]
  accounts: readonly string[]
}) {
  const yearScale = YEAR_BASE[input.year] / 4200
  const monthScale = input.months.length ? input.months.length / 12 : monthsElapsed(input.year) / 12
  const accountsScale = input.accounts.length ? Math.min(1, input.accounts.length * 0.07) : 1
  return yearScale * monthScale * accountsScale
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
}

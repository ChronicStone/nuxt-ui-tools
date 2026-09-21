/**
 * Dashboard mock backend, ported from the identity4 artifact (Atelier direction): the same constants
 * and formulas, served through async endpoints with latency so staging, skeletons, and refresh
 * states are visible. Values only depend on the request, so switching params back and forth is
 * stable.
 */
import { useAccountsData } from '../composables/use-accounts-data'
import { wait } from '../utils/wait'

export const MONTHS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
] as const
export const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
export type MonthIndex = (typeof MONTH_INDEXES)[number]

export const YEARS = [2024, 2025, 2026] as const
export type DashboardYear = (typeof YEARS)[number]

export const CURRENCIES = ['EUR', 'USD'] as const
export type DashboardCurrency = (typeof CURRENCIES)[number]
const CUR_RATE: Record<DashboardCurrency, number> = { EUR: 1, USD: 1.09 }

const YEAR_UNITS: Partial<Record<number, number[]>> = {
  2024: [720, 760, 840, 910, 960, 1080, 880, 640, 930, 1040, 990, 1110],
  2025: [980, 1020, 1150, 1210, 1305, 1390, 1120, 860, 1240, 1380, 1310, 1420],
  2026: [1180, 1240, 1410, 1320, 1520, 1675, 1290, 980, 1455],
}
const YEAR_PRICE: Partial<Record<number, number>> = { 2024: 58.4, 2025: 60.2, 2026: 62.7 }
const YEAR_MARGIN: Partial<Record<number, number[]>> = {
  2024: [24.1, 24.8, 25.2, 26.0, 25.4, 27.1, 26.6, 25.9, 27.0, 27.8, 26.9, 28.4],
  2025: [27.1, 26.8, 28.2, 29.0, 28.4, 30.1, 29.6, 28.9, 30.4, 30.2, 29.3, 31.4],
  2026: [30.2, 30.8, 31.5, 31.1, 32.4, 33.0, 32.1, 31.4, 33.6],
}
const ADMIN_MODES = [
  { label: 'Surveillance en ligne', share: 42 },
  { label: 'Administration standard', share: 31 },
  { label: 'Sur site', share: 19 },
  { label: 'Combiné à un test', share: 8 },
]
export const PRODUCTS = [
  { id: 'en-gen', label: 'English General · 4 compétences', share: 38, version: 'v4.2' },
  { id: 'en-biz', label: 'English Business · 4 compétences', share: 24, version: 'v4.2' },
  { id: 'en-pos', label: 'English · Test de positionnement', share: 15, version: 'v2.1' },
  { id: 'fr-gen', label: 'Français · 4 compétences', share: 11, version: 'v2.0' },
  { id: 'es', label: 'Español', share: 7, version: 'v1.8' },
  { id: 'de', label: 'Deutsch', share: 5, version: 'v1.3' },
] as const
export type ProductId = (typeof PRODUCTS)[number]['id']
export const PRODUCT_IDS = PRODUCTS.map((product) => product.id)
const COUNTRIES = [
  { code: 'FR', name: 'France', share: 57 },
  { code: 'SA', name: 'Arabie saoudite', share: 12 },
  { code: 'MA', name: 'Maroc', share: 8 },
  { code: 'TN', name: 'Tunisie', share: 6 },
  { code: 'ES', name: 'Espagne', share: 5 },
  { code: 'CH', name: 'Suisse', share: 4 },
  { code: '—', name: 'Autres', share: 8 },
]
const TOP_ACCOUNTS = [
  { change: 12, name: 'Demand QA France', type: 'Client', units: 1420 },
  { change: 31, name: 'Princess Nourah University', type: 'Partenaire stratégique', units: 1180 },
  { change: 4, name: 'Lingua Nova Formation', type: 'Client', units: 940 },
  { change: -3, name: 'Cap Compétences Bretagne', type: 'Client', units: 760 },
  { change: 18, name: 'Iberia Certification Hub', type: 'Centre de test autorisé', units: 620 },
  { change: 1, name: 'Helvetia Language Institute', type: 'Partenaire', units: 540 },
  { change: -7, name: 'Nordic Proctoring Center', type: 'Centre de test', units: 410 },
]
const ACCOUNT_TYPES = [
  { label: 'Clients', share: 61 },
  { label: 'Partenaires', share: 19 },
  { label: 'Centres de test', share: 13 },
  { label: 'Éducation', share: 7 },
]
const LINE_SHAPES: Record<ProductId, number[]> = {
  de: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  'en-biz': [1, 0.96, 1.05, 1.1, 1.14, 1.22, 0.95, 0.7, 1.1, 1.2, 1.15, 1.28],
  'en-gen': [1, 1.02, 1.12, 1.05, 1.2, 1.32, 1.02, 0.78, 1.15, 1.25, 1.18, 1.3],
  'en-pos': [0.8, 0.85, 1.1, 1.15, 1.05, 1.3, 1.1, 0.9, 1.25, 1.1, 1.05, 1.2],
  es: [0.9, 0.95, 1, 1.05, 1.1, 1.15, 1, 0.8, 1.05, 1.1, 1.05, 1.1],
  'fr-gen': [1.1, 1.05, 1, 1.02, 1.08, 1.1, 0.9, 0.75, 1.05, 1.15, 1.1, 1.2],
}
export const PRODUCT_PRESETS: { label: string; products: ProductId[] }[] = [
  { label: 'Gamme English', products: ['en-gen', 'en-biz', 'en-pos'] },
  { label: 'Langues romanes', products: ['fr-gen', 'es'] },
  { label: 'Tout le catalogue', products: [...PRODUCT_IDS] },
]

const CERT_ACCOUNTS = [
  'Blade Academy',
  'Bunkerlab',
  'MCA Formation',
  'Forma 2 Plus',
  'GetSkills',
  'Forma Flex 365',
  'SAS Pro Formation',
  'Services Pro',
  'Business Speaking',
  'Capinspire',
  'English Language Center',
  'Akeris Formation',
  'Goodsir RA',
  'Zia',
  'ANFPC',
]
interface CertRow {
  id: string
  name: string
  registered: number
  delivered: number
  completion: number
  completion3: number
  success: number
  aboveA1: number
  compromised: number
  onsite: number
  online: number
  months: number[]
}
export const CERT_ROWS: CertRow[] = CERT_ACCOUNTS.map((name, index) => {
  const registered = Math.round(640 * 0.86 ** index) + 40
  const completion = 0.48 + (((index * 37) % 40) / 100) * 0.9
  const passages = registered * (0.22 + ((index * 13) % 40) / 100)
  return {
    aboveA1: 0.6 + ((index * 19) % 30) / 100,
    completion: Math.min(0.94, completion),
    completion3: Math.min(0.98, completion + 0.28),
    compromised: 0.03 + ((index * 11) % 9) / 100,
    delivered: Math.round(registered * (0.36 + ((index * 23) % 30) / 100)),
    id: `ca${index}`,
    months: MONTHS.map((_, month) =>
      Math.round((registered / 12) * (0.6 + (((index + month) * 7) % 9) / 10)),
    ),
    name,
    online: Math.round(passages * 0.58),
    onsite: Math.round(passages * 0.42),
    registered,
    success: 0.62 + ((index * 19) % 30) / 100,
  }
})
const EDOF_SPLIT = [
  { color: 'series-4', label: 'Non traité', share: 9 },
  { color: 'series-5', label: 'En formation', share: 31 },
  { color: 'series-3', label: 'Service fait', share: 14 },
  { color: 'series-2', label: 'Service fait validé', share: 17 },
  { color: 'series-1', label: 'Facturé', share: 23 },
  { color: 'series-6', label: 'Annulé', share: 6 },
]
const CEFR = [
  { level: 'A1', share: 6 },
  { level: 'A2', share: 17 },
  { level: 'B1', share: 31 },
  { level: 'B2', share: 28 },
  { level: 'C1', share: 14 },
  { level: 'C2', share: 4 },
]
const DELIVERY_DELAY = [
  { label: '< 7 j', share: 41 },
  { label: '7 – 14 j', share: 29 },
  { label: '15 – 30 j', share: 19 },
  { label: '> 30 j', share: 11 },
]

function sum(values: readonly (number | null | undefined)[]) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

/** Simulated round trip: 350–900 ms, the same for a given key so reloads feel consistent. */
function latency(key: string) {
  let hash = 0
  for (const char of key) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0
  return 350 + (Math.abs(hash) % 550)
}

async function respond<T>(key: string, value: () => T): Promise<T> {
  await wait(latency(key))
  return value()
}

// ---------------------------------------------------------------------------
// Consumption
// ---------------------------------------------------------------------------

interface ConsumptionInput {
  year: DashboardYear
  account?: string
}

const accountScale = (account: string | undefined) => (account ? 0.11 : 1)
const unitsFor = (year: number, account?: string) =>
  (YEAR_UNITS[year] ?? []).map((value) => Math.round(value * accountScale(account)))
const billedFor = (year: number, account?: string) =>
  unitsFor(year, account).map(
    (value) => value * (YEAR_PRICE[year] ?? 0) * (0.94 + ((year + value) % 5) / 100),
  )
const marginFor = (year: number) => YEAR_MARGIN[year] ?? []

export interface ConsumptionSummary {
  units: number
  unitsPrevious: number
  billed: number
  billedPrevious: number
  billedUnits: number
  margin: number
  marginPrevious: number
  accounts: number
  accountsChange: number | null
}

export interface ConsumptionMonth {
  month: MonthIndex
  used: number | null
  billed: number | null
  previous: number | null
}

export interface BillingMonth {
  month: MonthIndex
  billed: number | null
  margin: number | null
}

export interface MarginMonth {
  month: MonthIndex
  margin: number | null
  previous: number | null
}

export interface UnitShare {
  label: string
  share: number
  units: number
}

export type ProductLineMonth = { month: MonthIndex } & Partial<Record<ProductId, number>>

export const dashboardApi = {
  consumption: {
    summary: (input: ConsumptionInput & { currency: DashboardCurrency }) =>
      respond(`summary-${input.year}-${input.account}`, (): ConsumptionSummary => {
        const units = unitsFor(input.year, input.account)
        const previous = unitsFor(input.year - 1, input.account)
        const count = units.length
        const margins = marginFor(input.year)
        const rate = CUR_RATE[input.currency]
        const factor = input.year === 2026 ? 1 : input.year === 2025 ? 0.86 : 0.7
        return {
          accounts: input.account ? 1 : Math.round(248 * factor),
          accountsChange: input.account ? null : 14,
          billed: sum(billedFor(input.year, input.account)) * rate,
          billedPrevious: sum(billedFor(input.year - 1, input.account).slice(0, count)) * rate,
          billedUnits: Math.round(sum(units) * 0.965),
          margin: sum(margins) / margins.length,
          marginPrevious: sum(marginFor(input.year - 1).slice(0, count)) / count,
          units: sum(units),
          unitsPrevious: sum(previous.slice(0, count)),
        }
      }),
    months: (input: ConsumptionInput) =>
      respond(`months-${input.year}-${input.account}`, (): ConsumptionMonth[] => {
        const units = unitsFor(input.year, input.account)
        const previous = unitsFor(input.year - 1, input.account)
        return MONTH_INDEXES.map((month) => ({
          billed: units[month] === undefined ? null : Math.round((units[month] ?? 0) * 0.965),
          month,
          previous: previous[month] ?? null,
          used: units[month] ?? null,
        }))
      }),
    billing: (input: ConsumptionInput & { currency: DashboardCurrency }) =>
      respond(`billing-${input.year}-${input.account}`, (): BillingMonth[] => {
        const billed = billedFor(input.year, input.account)
        const margins = marginFor(input.year)
        return MONTH_INDEXES.map((month) => ({
          billed:
            billed[month] === undefined
              ? null
              : Math.round((billed[month] ?? 0) * CUR_RATE[input.currency]),
          margin: margins[month] ?? null,
          month,
        }))
      }),
    adminModes: (input: ConsumptionInput) =>
      respond(`modes-${input.year}-${input.account}`, (): UnitShare[] => {
        const units = sum(unitsFor(input.year, input.account))
        return ADMIN_MODES.map((mode) => ({ ...mode, units: (units * mode.share) / 100 }))
      }),
    topProducts: (input: ConsumptionInput) =>
      respond(`products-${input.year}-${input.account}`, () => {
        const units = sum(unitsFor(input.year, input.account))
        return PRODUCTS.map((product) => ({
          label: product.label,
          share: product.share,
          units: (units * product.share) / 100,
          version: product.version,
        }))
      }),
    topCountries: (input: ConsumptionInput) =>
      respond(`countries-${input.year}-${input.account}`, () => {
        const units = sum(unitsFor(input.year, input.account))
        return COUNTRIES.map((country) => ({ ...country, units: (units * country.share) / 100 }))
      }),
    topAccounts: (input: ConsumptionInput) =>
      respond(`accounts-${input.year}-${input.account}`, () =>
        TOP_ACCOUNTS.slice(0, 6).map((account) => ({
          ...account,
          units: account.units * accountScale(input.account),
        })),
      ),
    productLines: (input: ConsumptionInput & { products: readonly ProductId[] }) =>
      respond(`lines-${input.year}-${input.products.join()}`, (): ProductLineMonth[] => {
        const units = unitsFor(input.year, input.account)
        return MONTH_INDEXES.map((month) => {
          const row: ProductLineMonth = { month }
          const used = units[month]
          if (used === undefined) return row
          for (const id of input.products) {
            const product = PRODUCTS.find((entry) => entry.id === id)
            row[id] = Math.round(
              ((used * (product?.share ?? 0)) / 100) * (LINE_SHAPES[id][month] ?? 1),
            )
          }
          return row
        })
      }),
    accountTypes: () => respond('types', () => ACCOUNT_TYPES),
    margin: (input: { year: DashboardYear }) =>
      respond(`margin-${input.year}`, (): MarginMonth[] => {
        const current = marginFor(input.year)
        const previous = marginFor(input.year - 1)
        return MONTH_INDEXES.map((month) => ({
          margin: current[month] ?? null,
          month,
          previous: previous[month] ?? null,
        }))
      }),
  },

  // -------------------------------------------------------------------------
  // Candidates & certifications
  // -------------------------------------------------------------------------

  candidates: {
    summary: (input: CandidatesInput) =>
      respond(`c-summary-${candidatesKey(input)}`, () => {
        const scope = candidatesScope(input)
        const passages = scope.onsite + scope.online
        return {
          aboveA1: scope.weighted('aboveA1'),
          completion: scope.weighted('completion'),
          completion3: scope.weighted('completion3'),
          compromised: scope.weighted('compromised'),
          delivered: scope.delivered,
          online: scope.online,
          onlineShare: passages ? scope.online / passages : 0,
          onsite: scope.onsite,
          onsiteShare: passages ? scope.onsite / passages : 0,
          registered: scope.registered,
          success: scope.weighted('success'),
        }
      }),
    registrations: (input: CandidatesInput) =>
      respond(`c-reg-${candidatesKey(input)}`, () => {
        const scope = candidatesScope(input)
        return MONTH_INDEXES.map((month) => ({
          current: scope.monthly[month] ?? null,
          month,
          previous: Math.round(
            sum(scope.rows.map((row) => row.months[month])) * (0.74 + ((month * 7) % 6) / 25),
          ),
        }))
      }),
    funnel: (input: CandidatesInput) =>
      respond(`c-funnel-${candidatesKey(input)}`, () => {
        const scope = candidatesScope(input)
        const passed = Math.round(scope.registered * scope.weighted('completion'))
        const succeeded = Math.round(passed * scope.weighted('success'))
        return [
          { count: scope.registered, label: 'Inscrits' },
          { count: passed, label: 'Examen passé' },
          { count: succeeded, label: 'Examen réussi' },
          { count: Math.round(scope.delivered), label: 'Certificat délivré' },
        ]
      }),
    perAccount: (input: CandidatesInput) =>
      respond(`c-accounts-${candidatesKey(input)}`, () => {
        const scope = candidatesScope(input)
        return scope.rows.slice(0, 15).map((row) => ({
          delivered: Math.round(row.delivered * scope.monthScale),
          id: row.id,
          name: row.name,
          registered: Math.round(row.registered * scope.monthScale),
        }))
      }),
    proctoring: (input: CandidatesInput) =>
      respond(`c-proct-${candidatesKey(input)}`, () => {
        const scope = candidatesScope(input)
        return [
          { count: scope.onsite, label: 'Sur site' },
          { count: scope.online, label: 'Surveillance en ligne' },
        ]
      }),
    performance: (input: CandidatesInput) =>
      respond(`c-perf-${candidatesKey(input)}`, () =>
        candidatesScope(input)
          .rows.slice(0, 10)
          .map((row) => ({
            aboveA1: Number((row.aboveA1 * 100).toFixed(1)),
            completion: Number((row.completion * 100).toFixed(1)),
            completion3: Number((row.completion3 * 100).toFixed(1)),
            name: row.name,
            success: Number((row.success * 100).toFixed(1)),
          })),
      ),
    edof: (input: CandidatesInput) =>
      respond(`c-edof-${candidatesKey(input)}`, () => {
        const { registered } = candidatesScope(input)
        return EDOF_SPLIT.map((state) => ({ ...state, count: (registered * state.share) / 100 }))
      }),
    cefr: () => respond('c-cefr', () => CEFR),
    delay: (input: CandidatesInput) =>
      respond(`c-delay-${candidatesKey(input)}`, () => {
        const { delivered } = candidatesScope(input)
        return DELIVERY_DELAY.map((bucket) => ({
          ...bucket,
          count: (delivered * bucket.share) / 100,
        }))
      }),
  },

  accounts: {
    /** Paginated, searchable account picker source (the consumption tab's single account). */
    search: (input: { search: string; page: { index: number; size: number } }) =>
      respond(`acc-${input.search}-${input.page.index}`, () => {
        const term = input.search.trim().toLowerCase()
        const matches = useAccountsData().accounts.filter((account) =>
          account.name.toLowerCase().includes(term),
        )
        const start = (input.page.index - 1) * input.page.size
        return {
          hasMore: start + input.page.size < matches.length,
          options: matches.slice(start, start + input.page.size).map((account) => ({
            label: account.name,
            value: account.id,
          })),
        }
      }),
    byIds: (ids: readonly string[]) =>
      respond(`acc-ids-${ids.join()}`, () =>
        useAccountsData()
          .accounts.filter((account) => ids.includes(account.id))
          .map((account) => ({ label: account.name, value: account.id })),
      ),
  },
}

interface CandidatesInput {
  year: DashboardYear
  months: readonly MonthIndex[]
  accounts: readonly string[]
}

function candidatesKey(input: CandidatesInput) {
  return `${input.year}-${input.months.join()}-${input.accounts.join()}`
}

function candidatesScope(input: CandidatesInput) {
  const rows = input.accounts.length
    ? CERT_ROWS.filter((row) => input.accounts.includes(row.id))
    : CERT_ROWS
  const monthsInScope: readonly number[] = input.months.length
    ? input.months
    : MONTH_INDEXES.filter((month) => input.year < 2026 || month < 9)
  const monthly = MONTH_INDEXES.map((month) =>
    monthsInScope.includes(month) ? sum(rows.map((row) => row.months[month])) : null,
  )
  const registeredAll = sum(rows.map((row) => row.registered))
  const registered = sum(monthly)
  const monthScale = registeredAll ? registered / registeredAll : 0
  return {
    delivered: sum(rows.map((row) => row.delivered)) * monthScale,
    monthScale,
    monthly,
    online: sum(rows.map((row) => row.online)) * monthScale,
    onsite: sum(rows.map((row) => row.onsite)) * monthScale,
    registered,
    rows,
    weighted: (key: 'completion' | 'completion3' | 'success' | 'aboveA1' | 'compromised') =>
      registeredAll ? sum(rows.map((row) => row[key] * row.registered)) / registeredAll : 0,
  }
}

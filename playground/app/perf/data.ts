import { queryOptions } from '@tanstack/vue-query'

import { defineRemoteOptions } from '#ui-tools/shared'

export const CURRENCIES = { EUR: 'EUR', GBP: 'GBP', USD: 'USD' } as const
export const CURRENCY_SYMBOLS = { EUR: '€', GBP: '£', USD: '$' } as const

export const COUNTRIES = [
  {
    code: 'FR',
    name: 'France',
    regions: ['Île-de-France', 'Occitanie', 'Bretagne'],
    taxRates: [20, 10, 5.5],
  },
  {
    code: 'BE',
    name: 'Belgium',
    regions: ['Brussels', 'Flanders', 'Wallonia'],
    taxRates: [21, 12, 6],
  },
  { code: 'CH', name: 'Switzerland', regions: ['Geneva', 'Vaud', 'Zurich'], taxRates: [8.1, 2.6] },
  { code: 'DE', name: 'Germany', regions: ['Bavaria', 'Berlin', 'Hesse'], taxRates: [19, 7] },
  {
    code: 'ES',
    name: 'Spain',
    regions: ['Catalonia', 'Madrid', 'Andalusia'],
    taxRates: [21, 10, 4],
  },
  { code: 'IT', name: 'Italy', regions: ['Lombardy', 'Lazio', 'Tuscany'], taxRates: [22, 10, 5] },
  {
    code: 'GB',
    name: 'United Kingdom',
    regions: ['England', 'Scotland', 'Wales'],
    taxRates: [20, 5],
  },
  {
    code: 'US',
    name: 'United States',
    regions: ['California', 'New York', 'Texas'],
    taxRates: [0],
  },
] as const

export const TEAMS = [
  'Platform',
  'Growth',
  'Data',
  'Design',
  'Support',
  'Sales',
  'Finance',
  'Legal',
].map((name, index) => ({ id: `team-${index}`, name }))

export const USERS = Array.from({ length: 240 }, (_, index) => ({
  id: `user-${index}`,
  name: `User ${String(index + 1).padStart(3, '0')}`,
}))

export const PRODUCT_KINDS = {
  discount: 'discount',
  product: 'product',
  service: 'service',
} as const

export const PRODUCTS = Array.from({ length: 120 }, (_, index) => ({
  id: `product-${index}`,
  kind: index % 3 === 0 ? PRODUCT_KINDS.service : PRODUCT_KINDS.product,
  name: `${index % 3 === 0 ? 'Service' : 'Product'} ${index + 1}`,
  price: 10 + index * 1.25,
}))

export const ROLE_OPTIONS = [
  { label: 'Owner', value: 'owner' },
  { label: 'Manager', value: 'manager' },
  { label: 'Reviewer', value: 'reviewer' },
]

export const SKILL_OPTIONS = [
  'TypeScript',
  'Vue',
  'Nuxt',
  'PostgreSQL',
  'Design',
  'Writing',
  'Sales',
  'Support',
  'Data',
  'DevOps',
  'Security',
  'Finance',
].map((label, index) => ({ label, value: `skill-${index}` }))

export const STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Live', value: 'live' },
  { label: 'Archived', value: 'archived' },
]

export const CHANNEL_OPTIONS = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Push', value: 'push' },
]

export const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
]

export const LEVEL_OPTIONS = [
  { label: 'Junior', value: 'junior' },
  { label: 'Mid', value: 'mid' },
  { label: 'Senior', value: 'senior' },
  { label: 'Principal', value: 'principal' },
]

export const CITY_OPTIONS = [
  'Paris',
  'Lyon',
  'Marseille',
  'Brussels',
  'Geneva',
  'Berlin',
  'Madrid',
  'Rome',
]

export const BIN_TYPE_OPTIONS = [
  { label: 'Shelf', value: 'shelf' },
  { label: 'Pallet', value: 'pallet' },
  { label: 'Cold', value: 'cold' },
]

export const CURRENCY_OPTIONS = Object.values(CURRENCIES).map((currency) => ({
  label: currency,
  value: currency,
}))

export const teamsQuery = queryOptions({
  queryFn: async () => TEAMS,
  queryKey: ['perf', 'teams'],
  staleTime: Number.POSITIVE_INFINITY,
})

export const countriesQuery = queryOptions({
  queryFn: async () => COUNTRIES,
  queryKey: ['perf', 'countries'],
  staleTime: Number.POSITIVE_INFINITY,
})

export const productsQuery = queryOptions({
  queryFn: async () => PRODUCTS,
  queryKey: ['perf', 'products'],
  staleTime: Number.POSITIVE_INFINITY,
})

export function sleep(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration))
}

/** Teams behind a slow request, a new one per mount, so each mount shows the loading state. */
export function slowTeamsQuery(mount: number) {
  return queryOptions({
    queryFn: async () => {
      await sleep(1200)
      return TEAMS
    },
    queryKey: ['perf', 'teams-slow', mount],
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export const userOptions = defineRemoteOptions(
  {
    load: ({ page, search }) =>
      queryOptions({
        queryFn: async () => {
          await sleep(80)
          const matching = USERS.filter((user) =>
            user.name.toLowerCase().includes(search.toLowerCase()),
          )
          const start = (page.index - 1) * page.size
          return {
            hasMore: start + page.size < matching.length,
            rows: matching.slice(start, start + page.size),
          }
        },
        queryKey: ['perf', 'users', 'page', search, page.index, page.size],
      }),
    resolveSelected: ({ values }) =>
      queryOptions({
        queryFn: async () => {
          await sleep(80)
          return { rows: USERS.filter((user) => values.includes(user.id)) }
        },
        queryKey: ['perf', 'users', 'selected', values],
      }),
  },
  {
    key: 'perf-users',
    mapPage: ({ hasMore, rows }) => ({
      hasMore,
      options: rows.map((user) => ({ label: user.name, value: user.id })),
    }),
    mapSelected: ({ rows }) => rows.map((user) => ({ label: user.name, value: user.id })),
    pagination: { size: 20, type: 'page' },
    search: { debounce: 150 },
  },
)

export function regionOptions(country: unknown) {
  const match = COUNTRIES.find((entry) => entry.code === country)
  return (match?.regions ?? []).map((region) => ({ label: region, value: region }))
}

export function taxRateOptions(country: unknown) {
  const match = COUNTRIES.find((entry) => entry.code === country)
  return (match?.taxRates ?? []).map((rate) => ({ label: `${rate} %`, value: rate }))
}

export function isoDate(offset: number) {
  const date = new Date(Date.UTC(2026, 0, 5 + offset))
  return date.toISOString().slice(0, 10)
}

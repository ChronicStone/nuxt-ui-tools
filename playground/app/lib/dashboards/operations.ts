import { defineDashboardSchema } from '#ui-tools/dashboard'
import type { DashboardComparison } from '#ui-tools/dashboard'

/**
 * The operations dashboard: one view of operational blocks, fed by an inline mock API. The
 * `day` filter is written by the sessions chart and narrows the accounts table; the segment tab is
 * a filter of the accounts query.
 */

export interface Day {
  day: number
  sessions: number
  passed: number
  previous: number
}
export interface Alert {
  id: string
  level: 'error' | 'warning' | 'info' | 'success'
  title: string
  detail: string
  count: number
}
export interface ActivityEvent {
  id: string
  at: number
  kind: 'certificate' | 'session' | 'account' | 'flag'
  text: string
}
export interface Account {
  id: string
  name: string
  kind: 'company' | 'school'
  sessions: number
  success: number
  change: number
  completion: number
}
export interface Month {
  month: string
  certificates: number
}

const ACCOUNTS: Pick<Account, 'kind' | 'name'>[] = [
  { kind: 'company', name: 'Acme Learning' },
  { kind: 'school', name: 'Globex Academy' },
  { kind: 'company', name: 'Initech Formation' },
  { kind: 'school', name: 'Umbrella Langues' },
  { kind: 'school', name: 'Stark Institute' },
  { kind: 'company', name: 'Wayne Education' },
  { kind: 'company', name: 'Hooli Campus' },
]
const SEGMENTS = ['all', 'company', 'school'] as const
type Segment = (typeof SEGMENTS)[number]

function later<T>(value: () => T, ms: number) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value()), ms))
}
function lastDays(count: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from(
    { length: count },
    (_, index) => today.getTime() - (count - 1 - index) * 86_400_000,
  )
}
const wave = (index: number, seed: number) => 0.8 + ((index * 37 + seed * 11) % 41) / 100
const dayLabel = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' })
/** `YYYY-MM-DD` → "Mar 12". */
function formatDay(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return year && month && day ? dayLabel.format(new Date(year, month - 1, day)) : iso
}
// The previous period ran a little lower; last year, lower still.
const previousRatio = (compare: DashboardComparison) => (compare === 'year' ? 0.74 : 0.9)

const api = {
  accounts: (day: string | undefined, segment: Segment) =>
    later(
      (): Account[] =>
        ACCOUNTS.flatMap((account, index) =>
          segment === 'all' || account.kind === segment
            ? [
                {
                  ...account,
                  change: ((index * 29) % 41) - 14,
                  completion: 38 + ((index * 23) % 60),
                  id: `a${index}`,
                  sessions: Math.round((day ? 30 : 420) * 0.86 ** index * wave(index, 5)),
                  success: 62 + ((index * 19) % 30),
                },
              ]
            : [],
        ),
      600,
    ),
  alerts: () =>
    later(
      (): Alert[] => [
        {
          count: 3,
          detail: 'Created this week, no session planned yet',
          id: 'new',
          level: 'info',
          title: 'New accounts to onboard',
        },
        {
          count: 12,
          detail: 'Flagged by online proctoring',
          id: 'flagged',
          level: 'error',
          title: 'Sessions to review',
        },
        {
          count: 7,
          detail: 'Waiting for more than 5 days',
          id: 'late',
          level: 'warning',
          title: 'Late corrections',
        },
      ],
      500,
    ),
  certificates: () =>
    later(
      (): Month[] =>
        ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, index) => ({
          certificates: Math.round(180 * wave(index, 7) + index * 22),
          month,
        })),
      800,
    ),
  daily: (compare: DashboardComparison) =>
    later(
      (): Day[] =>
        lastDays(14).map((day, index) => {
          const sessions = Math.round(96 * wave(index, 3))
          return {
            day,
            passed: Math.round(sessions * 0.78),
            previous: Math.round(sessions * previousRatio(compare) * wave(index + 4, 2)),
            sessions,
          }
        }),
      450,
    ),
  feed: () =>
    later((): ActivityEvent[] => {
      const kinds: ActivityEvent['kind'][] = ['certificate', 'session', 'flag', 'account']
      let elapsed = 3 * 60_000
      return Array.from({ length: 12 }, (_, index) => {
        const kind = kinds[index % kinds.length] ?? 'session'
        const account = ACCOUNTS[(index * 3) % ACCOUNTS.length]?.name ?? ''
        const at = Date.now() - elapsed
        elapsed += (25 + ((index * 53) % 180)) * 60_000
        const text = {
          account: `${account} joined`,
          certificate: `${account} delivered ${6 + index} certificates`,
          flag: `Session flagged at ${account}`,
          session: `Session opened at ${account}`,
        }[kind]
        return { at, id: `e${index}`, kind, text }
      })
    }, 900),
  kpis: (compare: DashboardComparison) =>
    later(() => {
      const ratio = previousRatio(compare)
      const sessions = lastDays(14).map((_, index) => Math.round(96 * wave(index, 3)))
      return {
        certificates: 1_240,
        delay: 1.8,
        passed: 812,
        previous:
          compare === 'none'
            ? null
            : { delay: 2.3, sessions: Math.round(1_100 * ratio), success: 0.752 * ratio },
        sessions,
        success: 0.774,
        total: sessions.reduce((sum, value) => sum + value, 0),
      }
    }, 400),
}

export function operationsSchema() {
  return defineDashboardSchema({
    key: 'operations',
    filters: (f) => ({
      compare: f.comparison({ defaultValue: 'previous', label: 'Compare with' }),
      /**
       * Day picked on the sessions chart (`YYYY-MM-DD`); narrows the accounts table. The filter bar
       * shows it as a removable pill while it is set.
       */
      day: f.string({ format: formatDay, label: 'Day' }),
    }),
    queries: ({ background, deferred, essential, filters }) => ({
      kpis: essential.query(() => ({
        queryFn: () => api.kpis(filters.compare),
        queryKey: ['operations', 'kpis', filters.compare],
      })),
      daily: essential.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.daily(filters.compare),
          queryKey: ['operations', 'daily', filters.compare],
        }),
      }),
      alerts: essential.query({
        defaultValue: [],
        query: () => ({ queryFn: api.alerts, queryKey: ['operations', 'alerts'] }),
      }),
      feed: background.query({
        defaultValue: [],
        query: () => ({ queryFn: api.feed, queryKey: ['operations', 'feed'] }),
      }),
      certificates: background.query({
        defaultValue: [],
        query: () => ({ queryFn: api.certificates, queryKey: ['operations', 'certificates'] }),
      }),
      accounts: deferred.query({
        defaultValue: [],
        // The segment tab is a filter of this query: typed, in the URL, and part of its key.
        filters: (f) => ({ segment: f.enum(SEGMENTS, { defaultValue: 'all' }) }),
        query: ({ filters: own }) => ({
          queryFn: () => api.accounts(filters.day, own.segment),
          queryKey: ['operations', 'accounts', filters.day, own.segment],
        }),
      }),
    }),
  })
}

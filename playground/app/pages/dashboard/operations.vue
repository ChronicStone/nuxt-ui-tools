<script setup lang="ts">
import { defineDashboardSchema, useDashboard, useDashboardFormat } from '#ui-tools/dashboard'
import type {
  DashboardComparison,
  DashboardMenuContext,
  DashboardSelectEvent,
  DashboardSeries,
  DashboardTableColumn,
  DashboardTableSort,
} from '#ui-tools/dashboard'

// Operational blocks on the stock theme: no dashboard tokens or class overrides in this app.

interface Day {
  day: number
  sessions: number
  passed: number
  previous: number
}
interface Alert {
  id: string
  level: 'error' | 'warning' | 'info' | 'success'
  title: string
  detail: string
  count: number
}
interface Event {
  id: string
  at: number
  kind: 'certificate' | 'session' | 'account' | 'flag'
  text: string
}
interface Account {
  id: string
  name: string
  kind: 'company' | 'school'
  sessions: number
  success: number
  change: number
  completion: number
}
interface Month {
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
    later((): Event[] => {
      const kinds: Event['kind'][] = ['certificate', 'session', 'flag', 'account']
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

const operations = defineDashboardSchema({
  key: 'operations',
  params: (p) => ({
    compare: p.comparison({ defaultValue: 'previous', label: 'Compare with' }),
    /**
     * Day picked on the sessions chart (`YYYY-MM-DD`); narrows the accounts table. The filter bar
     * shows it as a removable pill while it is set.
     */
    day: p.string({ format: formatDay, label: 'Day' }),
  }),
  queries: ({ background, deferred, essential, params }) => ({
    kpis: essential.query(() => ({
      queryFn: () => api.kpis(params.compare),
      queryKey: ['operations', 'kpis', params.compare],
    })),
    daily: essential.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.daily(params.compare),
        queryKey: ['operations', 'daily', params.compare],
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
      // The segment tab is a widget param: typed, in the URL, and part of the query key.
      params: (p) => ({ segment: p.enum(SEGMENTS, { defaultValue: 'all' }) }),
      query: ({ params: widget }) => ({
        queryFn: () => api.accounts(params.day, widget.segment),
        queryKey: ['operations', 'accounts', params.day, widget.segment],
      }),
    }),
  }),
})

const dashboard = useDashboard(operations)
const toast = useToast()
const format = useDashboardFormat()
const weekday = new Intl.DateTimeFormat('en', { day: 'numeric', weekday: 'short' })

function isoDay(time: number) {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function pickDay({ row }: DashboardSelectEvent<Day>) {
  const day = isoDay(row.day)
  dashboard.params.day = dashboard.params.day === day ? undefined : day
}

const comparing = computed(() => dashboard.params.compare !== 'none')
const previousLabel = computed(() =>
  dashboard.params.compare === 'year' ? 'last year' : 'previous period',
)
const dailySeries = computed<DashboardSeries<Day>[]>(() => [
  {
    compare: comparing.value ? (row) => row.previous : undefined,
    compareLabel: `Sessions (${previousLabel.value})`,
    key: 'sessions',
    label: 'Sessions',
    value: (row) => row.sessions,
  },
])

const icons: Record<Event['kind'], string> = {
  account: 'i-lucide-building-2',
  certificate: 'i-lucide-award',
  flag: 'i-lucide-shield-alert',
  session: 'i-lucide-monitor-play',
}
const colors: Record<Event['kind'], string> = {
  account: 'secondary',
  certificate: 'primary',
  flag: 'error',
  session: 'neutral',
}

// Accounts: sort in a local ref, the segment tab in the query's widget param, one picked account.
const sort = ref<DashboardTableSort | null>({ direction: 'desc', key: 'sessions' })
const pickedAccount = ref<string | null>(null)
const columns: DashboardTableColumn<Account>[] = [
  { key: 'name', label: 'Account', value: (row) => row.name },
  { key: 'sessions', label: 'Sessions', type: 'bar', value: (row) => row.sessions, width: '32%' },
  { key: 'success', label: 'Success', type: 'percent', value: (row) => row.success },
  { key: 'change', label: 'Change', type: 'delta', value: (row) => row.change },
]
const segmentTabs = computed(() =>
  [
    { label: 'All', value: 'all' as const },
    { label: 'Companies', value: 'company' as const },
    { label: 'Schools', value: 'school' as const },
  ].map((tab) => ({
    ...tab,
    // The count of the open tab, once its rows are in.
    count:
      dashboard.accounts.params.segment === tab.value && dashboard.accounts.state === 'ready'
        ? dashboard.accounts.data.length
        : null,
  })),
)
function accountActions(row: Account) {
  return [
    {
      icon: 'i-lucide-eye',
      inline: true,
      label: 'Preview',
      onSelect: () =>
        toast.add({ description: `${format.integer(row.sessions)} sessions`, title: row.name }),
    },
    { icon: 'i-lucide-external-link', label: 'Open account', to: '/dashboard/analytics' },
    { icon: 'i-lucide-download', label: 'Export sessions' },
    { type: 'separator' as const },
    { color: 'error' as const, icon: 'i-lucide-archive', label: 'Archive' },
  ]
}
function copyAsTsv(context: DashboardMenuContext) {
  return [
    'table' as const,
    'csv' as const,
    {
      icon: 'i-lucide-clipboard-copy',
      label: 'Copy as TSV',
      onSelect: () => {
        const table = context.table()
        if (!table) return
        const lines = [
          table.columns.map((column) => column.label),
          ...table.rows.map((row) => row.map((cell) => cell.text)),
        ]
        void navigator.clipboard?.writeText(lines.map((line) => line.join('\t')).join('\n'))
        toast.add({ title: `${context.title} copied` })
      },
    },
    'expand' as const,
  ]
}
</script>

<template>
  <PlaygroundContent mode="document">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Operations</h1>
        <div class="flex flex-wrap items-center gap-2">
          <NutDashboardFilters :dashboard />
          <NutDashboardRefresh :dashboard />
        </div>
      </header>

      <!-- KPI strip: one bordered surface, cells split by rules -->
      <NutDashboardGrid variant="panels" columns="1 sm:2 xl:4">
        <NutDashboardStat
          size="1"
          :source="dashboard.kpis"
          label="Sessions (14 days)"
          :value="(kpis) => kpis.total"
          :compare="(kpis) => kpis.previous?.sessions"
          :compare-label="(value) => `vs ${value} ${previousLabel}`"
          :trend="(kpis) => kpis.sessions"
          trend-type="bars"
        />
        <NutDashboardStat
          size="1"
          :source="dashboard.kpis"
          label="Success rate"
          :value="(kpis) => kpis.success * 100"
          :format="(value) => `${value.toFixed(1)}%`"
          :compare="(kpis) => (kpis.previous ? kpis.previous.success * 100 : null)"
          :compare-label="(value) => `vs ${value} ${previousLabel}`"
          :goal="() => 80"
          :status="
            (kpis) => (kpis.success < 0.8 ? { color: 'warning', label: 'Below goal' } : null)
          "
        />
        <NutDashboardStat
          size="1"
          :source="dashboard.kpis"
          label="Correction delay"
          :value="(kpis) => kpis.delay"
          :format="(value) => `${value} d`"
          :compare="(kpis) => kpis.previous?.delay"
          :compare-label="(value) => `vs ${value} ${previousLabel}`"
          invert-delta
          :status="() => ({ color: 'success', label: 'On time' })"
          :trend="(kpis) => kpis.sessions.map((_, index) => 2.6 - index * 0.05)"
        />
        <NutDashboardStat
          size="1"
          :source="dashboard.kpis"
          label="Certificates"
          :value="(kpis) => kpis.certificates"
          caption="this month"
          :goal="() => 1_500"
        />
      </NutDashboardGrid>

      <NutDashboardGrid menu freshness>
        <!-- Split card: a nested panels grid is one card with two panes -->
        <NutDashboardGrid variant="panels" columns="12" size="12 lg:8">
          <NutDashboardBarChart
            size="12 md:8"
            :source="dashboard.daily"
            title="Sessions per day"
            subtitle="click a day to filter accounts"
            :x="(row) => row.day"
            :x-format="(value) => weekday.format(Number(value))"
            x-label="Day"
            :series="dailySeries"
            :selected="(row) => isoDay(row.day) === dashboard.params.day"
            :points="14"
            :height="300"
            @select="pickDay"
          />
          <NutDashboardStats
            size="12 md:4"
            :source="dashboard.kpis"
            title="This period"
            columns="1"
            :items="[
              {
                key: 'sessions',
                label: 'Sessions',
                icon: 'i-lucide-monitor-play',
                value: (kpis) => kpis.total,
                progress: (kpis) => (kpis.total / 1_600) * 100,
              },
              {
                key: 'passed',
                label: 'Passed',
                icon: 'i-lucide-circle-check',
                color: 'success',
                value: (kpis) => kpis.passed,
                progress: (kpis) => (kpis.passed / kpis.total) * 100,
              },
              {
                key: 'failed',
                label: 'To retake',
                icon: 'i-lucide-rotate-ccw',
                color: 'warning',
                value: (kpis) => kpis.total - kpis.passed,
                status: () => ({ color: 'warning', label: 'Watch' }),
              },
            ]"
            :actions="[{ label: 'View report', placement: 'footer', to: '/dashboard/analytics' }]"
          />
        </NutDashboardGrid>

        <NutDashboardGauge
          size="12 lg:4"
          :source="dashboard.kpis"
          title="Monthly goal"
          subtitle="certificates delivered"
          :value="(kpis) => kpis.certificates"
          :max="1_600"
          :target="() => 1_500"
          caption="certificates"
          :color="(_, share) => (share >= 1500 / 1600 ? 'success' : 'primary')"
          :actions="[{ icon: 'i-lucide-target', label: 'Edit goal', variant: 'ghost' }]"
        />

        <NutDashboardTable
          v-model:sort="sort"
          size="12 lg:7"
          :source="dashboard.accounts"
          title="Accounts"
          :subtitle="dashboard.params.day ? `on ${dashboard.filters.day.display}` : 'last 14 days'"
          :columns
          :limit="6"
          :menu="copyAsTsv"
          :selected="(row) => row.id === pickedAccount"
          :row-actions="accountActions"
          :actions="[
            { label: 'All accounts', placement: 'footer', trailingIcon: 'i-lucide-arrow-right' },
          ]"
          @select="({ row }) => (pickedAccount = pickedAccount === row.id ? null : row.id)"
        >
          <template #toolbar>
            <NutDashboardTabs v-model="dashboard.accounts.params.segment" :items="segmentTabs" />
          </template>
        </NutDashboardTable>

        <NutDashboardAlerts
          size="12 lg:5"
          :source="dashboard.alerts"
          title="Needs attention"
          :severity="(alert) => alert.level"
          :label="(alert) => alert.title"
          :description="(alert) => alert.detail"
          :value="(alert) => alert.count"
          :action="
            (alert) =>
              alert.level === 'error'
                ? { label: 'Review', onClick: () => toast.add({ title: alert.title }) }
                : null
          "
          :row-actions="
            (alert) => [
              { icon: 'i-lucide-bell-off', label: 'Snooze for a day' },
              {
                icon: 'i-lucide-check',
                label: 'Mark as handled',
                onSelect: () => toast.add({ title: `${alert.title}: handled` }),
              },
            ]
          "
        />

        <NutDashboardList
          size="12 md:6 lg:4"
          :source="dashboard.accounts"
          title="Completion"
          subtitle="sessions graded"
          leading="ring"
          :percent="(row) => row.completion"
          :color="(row) => (row.completion < 50 ? 'warning' : 'primary')"
          :label="(row) => row.name"
          :description="(row) => (row.kind === 'company' ? 'Company' : 'School')"
          :value="(row) => row.sessions"
          :selected="(row) => row.id === pickedAccount"
          :limit="5"
        />

        <NutDashboardBarChart
          size="12 md:6 lg:4"
          :source="dashboard.certificates"
          title="Certificates"
          subtitle="per month"
          :x="(row) => row.month"
          :series="[
            { key: 'certificates', label: 'Certificates', value: (row) => row.certificates },
          ]"
          highlight="last"
          labels
          :legend="false"
          :points="6"
          :height="200"
        />

        <NutDashboardFeed
          size="12 lg:4"
          :source="dashboard.feed"
          title="Recent activity"
          group-by="day"
          :label="(event) => event.text"
          :time="(event) => event.at"
          :icon="(event) => icons[event.kind]"
          :color="(event) => colors[event.kind]"
          :limit="5"
        />
      </NutDashboardGrid>
    </div>
  </PlaygroundContent>
</template>

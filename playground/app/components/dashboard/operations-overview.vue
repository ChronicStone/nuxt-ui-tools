<script setup lang="ts">
import { injectDashboard, useDashboardFormat } from '#ui-tools/dashboard'
import type {
  DashboardMenuContext,
  DashboardSelectEvent,
  DashboardSeries,
  DashboardTableColumn,
  DashboardTableSort,
} from '#ui-tools/dashboard'

import { operationsSchema } from '../../lib/dashboards/operations'
import type { Account, ActivityEvent, Day } from '../../lib/dashboards/operations'

const dashboard = injectDashboard(operationsSchema)
const toast = useToast()
const format = useDashboardFormat()
const weekday = new Intl.DateTimeFormat('en', { day: 'numeric', weekday: 'short' })

function isoDay(time: number) {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function pickDay({ row }: DashboardSelectEvent<Day>) {
  const day = isoDay(row.day)
  dashboard.filters.day = dashboard.filters.day === day ? undefined : day
}

const comparing = computed(() => dashboard.filters.compare !== 'none')
const previousLabel = computed(() =>
  dashboard.filters.compare === 'year' ? 'last year' : 'previous period',
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

const icons: Record<ActivityEvent['kind'], string> = {
  account: 'i-lucide-building-2',
  certificate: 'i-lucide-award',
  flag: 'i-lucide-shield-alert',
  session: 'i-lucide-monitor-play',
}
const colors: Record<ActivityEvent['kind'], string> = {
  account: 'secondary',
  certificate: 'primary',
  flag: 'error',
  session: 'neutral',
}

// Accounts: sort in a local ref, the segment tab in the query's filter, one picked account.
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
      dashboard.accounts.filters.segment === tab.value && dashboard.accounts.state === 'ready'
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
      :status="(kpis) => (kpis.success < 0.8 ? { color: 'warning', label: 'Below goal' } : null)"
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
        :selected="(row) => isoDay(row.day) === dashboard.filters.day"
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
      subtitle="last 14 days"
      :filters="[dashboard.controls.day]"
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
        <NutDashboardTabs v-model="dashboard.accounts.filters.segment" :items="segmentTabs" />
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
      :series="[{ key: 'certificates', label: 'Certificates', value: (row) => row.certificates }]"
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
</template>

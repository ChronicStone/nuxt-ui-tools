<script setup lang="ts">
import { useDashboardFormat, useDashboardView } from '#ui-tools/dashboard'
import type {
  DashboardMenuContext,
  DashboardRowAction,
  DashboardSelectEvent,
  DashboardSeries,
  DashboardTableColumn,
  DashboardTableSort,
} from '#ui-tools/dashboard'

import { OPERATIONS_SORT_KEYS, operationsView } from '../../dashboards/analytics'
import type { OperationsSortKey } from '../../dashboards/analytics'
import { initials, MONTHS } from '../../data/dashboard'
import type {
  OperationsAccount,
  OperationsAlert,
  OperationsDay,
  OperationsEvent,
  OperationsEventKind,
} from '../../data/dashboard'

const operations = useDashboardView(operationsView)
const format = useDashboardFormat()
const toast = useToast()

const days = (value: number) => `${format.decimal(value)} j`

const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', weekday: 'short' })

/** `YYYY-MM-DD` of a local midnight: the URL form of the picked day. */
function isoDay(time: number) {
  const date = new Date(time)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
}

// Comparison period: a filter with localized options; the chart adds its faded bars.
const comparedTo = computed(() =>
  operations.filters.comparison === 'year' ? 'l’an dernier' : 'la période précédente',
)
const compareCaption = (value: string) => `contre ${value} sur ${comparedTo.value}`

// Drill-down: a bar narrows the accounts table to its day; the same bar clears it.
const dailySeries = computed<DashboardSeries<OperationsDay>[]>(() => [
  {
    color: 'series-1',
    compare: operations.filters.comparison === 'none' ? undefined : (row) => row.previous,
    compareLabel: operations.filters.comparison === 'year' ? 'Sessions (an dernier)' : undefined,
    key: 'sessions',
    label: 'Sessions',
    value: (row) => row.sessions,
  },
])
function pickDay({ row }: DashboardSelectEvent<OperationsDay>) {
  const day = isoDay(row.day)
  operations.filters.day = operations.filters.day === day ? undefined : day
}

function alertAction(alert: OperationsAlert) {
  const { action } = alert
  if (!action) return null
  return {
    label: action,
    onClick: () => toast.add({ color: 'neutral', title: `${action} · ${alert.title}` }),
  }
}
function openAlert({ row }: DashboardSelectEvent<OperationsAlert>) {
  toast.add({ color: 'neutral', description: row.detail, title: row.title })
}

const eventKinds: Record<OperationsEventKind, { icon: string; color: string }> = {
  account: { color: 'series-3', icon: 'i-lucide-building-2' },
  certificate: { color: 'series-1', icon: 'i-lucide-award' },
  flag: { color: 'error', icon: 'i-lucide-shield-alert' },
  payment: { color: 'success', icon: 'i-lucide-receipt' },
  session: { color: 'neutral', icon: 'i-lucide-monitor-play' },
}
function openEvent({ row }: DashboardSelectEvent<OperationsEvent>) {
  toast.add({ color: 'neutral', description: row.detail, title: row.text })
}

const accountColumns: DashboardTableColumn<OperationsAccount>[] = [
  { key: 'name', label: 'Compte', value: (row) => row.name },
  { key: 'sessions', label: 'Sessions', type: 'bar', value: (row) => row.sessions, width: '30%' },
  { key: 'success', label: 'Réussite', type: 'percent', value: (row) => row.success },
  { key: 'change', label: 'Évolution', type: 'delta', value: (row) => row.change },
  { format: days, key: 'delay', label: 'Délai moyen', type: 'number', value: (row) => row.delay },
]
// The table sort lives in the accounts query's filters, so it is in the URL.
const accountsSort = computed<DashboardTableSort | null>({
  get: () => ({
    direction: operations.accounts.filters.order,
    key: operations.accounts.filters.sort,
  }),
  set: (next) => {
    operations.accounts.filters.sort = next && isSortKey(next.key) ? next.key : 'sessions'
    operations.accounts.filters.order = next?.direction ?? 'desc'
  },
})
function isSortKey(key: string): key is OperationsSortKey {
  return OPERATIONS_SORT_KEYS.some((entry) => entry === key)
}
function openAccount({ row }: DashboardSelectEvent<OperationsAccount>) {
  toast.add({
    color: 'neutral',
    description: `${format.integer(row.sessions)} sessions · ${format.percent(row.success)} de réussite`,
    title: `Ouvrir ${row.name}`,
  })
}
// The accounts table: a segment tab (a query filter), one picked account mirrored by the
// completion list, row actions, and a menu built from the card's own table.
const pickedAccount = ref<string | null>(null)
function toggleAccount({ row }: DashboardSelectEvent<OperationsAccount>) {
  pickedAccount.value = pickedAccount.value === row.id ? null : row.id
}
const segmentTabs = computed(() =>
  [
    { label: 'Tous', value: 'all' as const },
    { label: 'Entreprises', value: 'company' as const },
    { label: 'Écoles', value: 'school' as const },
  ].map((tab) => ({
    ...tab,
    // The count of the open tab, once its rows are in.
    count:
      operations.accounts.filters.segment === tab.value && operations.accounts.state === 'ready'
        ? operations.accounts.data.length
        : null,
  })),
)
function accountActions(row: OperationsAccount): DashboardRowAction[] {
  return [
    {
      icon: 'i-lucide-eye',
      inline: true,
      label: 'Aperçu',
      onSelect: () => openAccount({ index: 0, row }),
    },
    { icon: 'i-lucide-external-link', label: 'Ouvrir le compte', to: '/accounts' },
    { icon: 'i-lucide-mail', label: 'Contacter le référent' },
    { type: 'separator' },
    { color: 'error', icon: 'i-lucide-pause', label: 'Suspendre les sessions' },
  ]
}
function accountsMenu(context: DashboardMenuContext) {
  return [
    'table' as const,
    'csv' as const,
    {
      icon: 'i-lucide-clipboard-copy',
      label: 'Copier pour un tableur',
      onSelect: () => {
        const table = context.table()
        if (!table) return
        const grid = [
          table.columns.map((column) => column.label),
          ...table.rows.map((row) => row.map((cell) => cell.text)),
        ]
        void navigator.clipboard?.writeText(grid.map((cells) => cells.join('\t')).join('\n'))
        toast.add({ color: 'neutral', title: `${context.title} · copié` })
      },
    },
    'expand' as const,
  ]
}
function alertActions(alert: OperationsAlert): DashboardRowAction[] {
  return [
    {
      icon: 'i-lucide-bell-off',
      label: 'Masquer 24 h',
      onSelect: () => toast.add({ color: 'neutral', title: `${alert.title} · masqué` }),
    },
    { icon: 'i-lucide-check', label: 'Marquer comme traité' },
  ]
}
</script>

<template>
  <NutDashboardGrid variant="panels" columns="2 xl:4">
    <NutDashboardStat
      size="1"
      :source="operations.kpis"
      label="Sessions sur 14 jours"
      :value="(d) => d.sessionsPeriod"
      format="integer"
      :compare="(d) => d.sessionsPeriodPrevious"
      :compare-label="compareCaption"
      :trend="(d) => d.sessionsTrend"
      trend-type="bars"
    />
    <NutDashboardStat
      size="1"
      :source="operations.kpis"
      label="Taux de réussite"
      :value="(d) => d.successRate"
      format="ratio"
      :compare="(d) => d.successPeriodPrevious"
      compare-mode="difference"
      :compare-label="compareCaption"
      :goal="(d) => d.successGoal"
      :status="
        (d) =>
          d.successRate < d.successGoal
            ? { color: 'warning', label: 'Sous l’objectif' }
            : { color: 'success', label: 'Objectif atteint' }
      "
    />
    <NutDashboardStat
      size="1"
      :source="operations.kpis"
      label="Délai de correction"
      :value="(d) => d.correctionDelay"
      :format="days"
      :compare="(d) => d.correctionPrevious"
      invert-delta
      caption="entre passage et résultat"
      :trend="(d) => d.correctionTrend"
      trend-type="line"
      trend-color="series-3"
      :status="
        (d) =>
          d.correctionDelay <= 2
            ? { color: 'success', label: 'Dans les temps' }
            : { color: 'error', label: 'En retard' }
      "
    />
    <NutDashboardStat
      size="1"
      :source="operations.kpis"
      label="Certificats délivrés"
      :value="(d) => d.certificates"
      format="integer"
      caption="ce mois-ci"
      :goal="(d) => d.certificatesGoal"
    />
  </NutDashboardGrid>

  <!-- A panels grid is one card split in panes: the chart and its period summary -->
  <NutDashboardGrid variant="panels" menu freshness>
    <NutDashboardBarChart
      size="12 xl:8"
      :source="operations.daily"
      title="Sessions par jour"
      subtitle="cliquez une journée pour filtrer les comptes"
      :x="(row) => row.day"
      :x-format="(value) => weekdayFormat.format(Number(value))"
      x-label="Journée"
      :series="dailySeries"
      :selected="(row) => isoDay(row.day) === operations.filters.day"
      :points="14"
      :height="300"
      @select="pickDay"
    />
    <NutDashboardStats
      size="12 xl:4"
      :source="operations.kpis"
      title="Sur la période"
      subtitle="14 derniers jours"
      columns="1"
      :items="[
        {
          key: 'sessions',
          label: 'Sessions passées',
          icon: 'i-lucide-monitor-play',
          value: (d) => d.sessionsPeriod,
          format: 'integer',
          progress: (d) => (d.sessionsPeriod / 1_600) * 100,
        },
        {
          key: 'passed',
          label: 'Candidats reçus',
          icon: 'i-lucide-circle-check',
          color: 'success',
          value: (d) => d.passedPeriod,
          format: 'integer',
          progress: (d) => (d.passedPeriod / d.sessionsPeriod) * 100,
        },
        {
          key: 'retakes',
          label: 'À repasser',
          icon: 'i-lucide-rotate-ccw',
          color: 'warning',
          value: (d) => d.retakesPeriod,
          format: 'integer',
          status: () => ({ color: 'warning', label: 'À suivre' }),
        },
      ]"
      :actions="[{ label: 'Voir le rapport', placement: 'footer', to: '/accounts' }]"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels" menu freshness>
    <NutDashboardAlerts
      size="12 xl:5"
      :source="operations.alerts"
      title="À traiter"
      subtitle="par priorité"
      :severity="(alert) => alert.level"
      :label="(alert) => alert.title"
      :description="(alert) => alert.detail"
      :value="(alert) => alert.count"
      :action="alertAction"
      :row-actions="alertActions"
      :limit="5"
      @select="openAlert"
    />
    <NutDashboardGauge
      size="12 md:6 xl:3"
      :source="operations.kpis"
      title="Objectif mensuel"
      subtitle="certificats délivrés"
      :value="(d) => d.certificates"
      :max="(d) => d.certificatesGoal * 1.1"
      :target="(d) => d.certificatesGoal"
      format="integer"
      caption="certificats"
      :color="(_, share) => (share >= 1 / 1.1 ? 'success' : 'series-1')"
      :actions="[{ icon: 'i-lucide-target', label: 'Modifier', variant: 'ghost' }]"
    />
    <NutDashboardBarChart
      size="12 md:6 xl:4"
      :source="operations.certificatesByMonth"
      title="Certificats"
      :subtitle="`par mois · ${operations.filters.year}`"
      :x="(row) => MONTHS[row.month] ?? ''"
      :series="[{ key: 'value', label: 'Certificats', value: (row) => row.value }]"
      format="integer"
      highlight="last"
      labels
      :legend="false"
      :points="9"
      :height="200"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels" menu freshness>
    <NutDashboardTable
      v-model:sort="accountsSort"
      size="12"
      :source="operations.accounts"
      title="Performance par compte"
      subtitle="14 derniers jours"
      :filters="[operations.controls.day]"
      :columns="accountColumns"
      :limit="8"
      :menu="accountsMenu"
      :selected="(row) => row.id === pickedAccount"
      :row-actions="accountActions"
      :actions="[
        {
          label: 'Tous les comptes',
          placement: 'footer',
          to: '/accounts',
          trailingIcon: 'i-lucide-arrow-right',
        },
      ]"
      @select="toggleAccount"
    >
      <template #toolbar>
        <NutDashboardTabs v-model="operations.accounts.filters.segment" :items="segmentTabs" />
      </template>
      <template #cell-name="{ row, value }">
        <span class="flex min-w-0 items-center gap-2.5">
          <span class="dash-it-av">{{ initials(row.name) }}</span>
          <span class="truncate">{{ value }}</span>
        </span>
      </template>
    </NutDashboardTable>
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels" menu freshness>
    <NutDashboardList
      size="12 xl:5"
      :source="operations.accounts"
      title="Avancement des corrections"
      subtitle="part des sessions corrigées"
      leading="ring"
      :percent="(row) => row.completion"
      :color="(row) => (row.completion < 60 ? 'warning' : 'series-1')"
      :label="(row) => row.name"
      :description="(row) => (row.kind === 'school' ? 'École' : 'Entreprise')"
      :value="(row) => days(row.delay)"
      :selected="(row) => row.id === pickedAccount"
      :limit="6"
      @select="toggleAccount"
    />
    <NutDashboardFeed
      size="12 xl:7"
      :source="operations.activity"
      title="Activité récente"
      group-by="day"
      :label="(event) => event.text"
      :description="(event) => event.detail"
      :time="(event) => event.at"
      :icon="(event) => eventKinds[event.kind].icon"
      :color="(event) => eventKinds[event.kind].color"
      :limit="7"
      @select="openEvent"
    />
  </NutDashboardGrid>
</template>

<style scoped>
/* Initials tile of an account, in the accounts table. */
.dash-it-av {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: 4px;
  background: var(--ui-bg-muted);
  color: var(--ex-ink-soft);
  font-size: 8.5px;
  font-weight: 600;
}
</style>

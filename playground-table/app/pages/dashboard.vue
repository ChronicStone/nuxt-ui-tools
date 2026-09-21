<script setup lang="ts">
import { useNow, useScroll } from '@vueuse/core'

import { useDashboard } from '#ui-tools/dashboard'
import type {
  DashboardComparison,
  DashboardMenuContext,
  DashboardRowAction,
  DashboardSelectEvent,
  DashboardSeries,
  DashboardTableColumn,
  DashboardTableSort,
} from '#ui-tools/dashboard'

import { analyticsDashboard, OPERATIONS_SORT_KEYS } from '../dashboards/analytics'
import type { OperationsSortKey } from '../dashboards/analytics'
import {
  CERT_ROWS,
  CURRENCIES,
  MONTH_INDEXES,
  MONTHS,
  PRODUCT_PRESETS,
  PRODUCTS,
  YEARS,
} from '../data/dashboard'
import type {
  MonthIndex,
  OperationsAccount,
  OperationsAlert,
  OperationsDay,
  OperationsEvent,
  OperationsEventKind,
  ProductId,
  ProductLineMonth,
} from '../data/dashboard'

const dashboard = useDashboard(analyticsDashboard)
const conso = dashboard.consumption
const cand = dashboard.candidates
const ops = dashboard.operations

// --- Formatting (fr-FR, as in the artifact) -------------------------------------------------

const nf = (value: number) => Math.round(value).toLocaleString('fr-FR')
const fmt1 = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
const pf = (ratio: number) => `${fmt1(ratio * 100)} %`
const sign = (value: number) => (value >= 0 ? '+' : '−')
const dl = (value: number) => `${sign(value)}${fmt1(Math.abs(value))} %`
const pts = (value: number) =>
  `${sign(value)}${fmt1(Math.abs(value))} ${Math.abs(value) >= 2 ? 'pts' : 'pt'}`
const symbol = computed(() => (conso.params.currency === 'EUR' ? '€' : '$'))
const money = (value: number) => `${nf(value)} ${symbol.value}`
const kmoney = (value: number) =>
  `${value >= 1000 ? `${Math.round(value / 1000).toLocaleString('fr-FR')} k` : nf(value)}${symbol.value}`
const kunits = (value: number) => (value >= 1000 ? `${Math.round(value / 1000)} k` : nf(value))
const percent = (value: number) => `${value} %`
const change = (current: number, previous: number) =>
  previous ? ((current - previous) / previous) * 100 : null
const monthLabel = (row: { month: MonthIndex }) => MONTHS[row.month]
const shortLabel = (value: string | number | Date) => {
  const text = String(value)
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
}
const sum = (values: readonly (number | null | undefined)[]) =>
  values.reduce<number>((total, value) => total + (value ?? 0), 0)
const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

const year = computed(() => dashboard.params.year)
const previousYear = computed(() => String(dashboard.params.year - 1))

// --- Header ---------------------------------------------------------------------------------

// The header and tabs stay pinned on desktop; a shadow appears once content scrolls under them.
const scroller = useTemplateRef<HTMLElement>('scroller')
const { y: scrollY } = useScroll(scroller)
const stuck = computed(() => scrollY.value > 0)

const now = useNow({ interval: 60_000 })
const today = computed(() => {
  const text = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(now.value)
  return text.charAt(0).toUpperCase() + text.slice(1)
})

// Consumption: one remote account.
const accountOptions = conso.options.account
const accountLabel = computed(
  () => accountOptions.selected[0]?.label ?? (conso.params.account ? '…' : 'Tous les comptes'),
)
function pickAccount(value: string | undefined) {
  conso.params.account = value
  accountOptions.open = false
}

// Candidates: months and accounts, both multiple.
const monthsLabel = computed(() => {
  const { months } = cand.params
  if (!months.length) return 'Tous les mois'
  return months.length === 1 ? MONTHS[months[0] ?? 0] : `${months.length} mois`
})
function toggleMonth(month: MonthIndex) {
  const { months } = cand.params
  cand.params.months = months.includes(month)
    ? months.filter((entry) => entry !== month)
    : [...months, month].toSorted((a, b) => a - b)
}
const certSearch = ref('')
const certAccounts = computed(() => {
  const term = certSearch.value.trim().toLowerCase()
  return CERT_ROWS.filter((row) => row.name.toLowerCase().includes(term))
})
const accountsLabel = computed(() => {
  const { accounts } = cand.params
  if (!accounts.length) return 'Tous les comptes'
  if (accounts.length > 1) return `${accounts.length} comptes`
  return CERT_ROWS.find((row) => row.id === accounts[0])?.name ?? '1 compte'
})
function toggleCertAccount(id: string) {
  const { accounts } = cand.params
  cand.params.accounts = accounts.includes(id)
    ? accounts.filter((entry) => entry !== id)
    : [...accounts, id]
}

// --- Consumption blocks ---------------------------------------------------------------------

const consumptionSeries = [
  { color: 'series-1', key: 'used', label: 'Consommés', value: (row: MonthRow) => row.used },
  { color: 'series-4', key: 'billed', label: 'Facturés', value: (row: MonthRow) => row.billed },
]
type MonthRow = (typeof conso.months.data)[number]
const consumptionComparison = computed(() =>
  conso.params.compare
    ? {
        color: 'series-5',
        key: 'previous',
        label: previousYear.value,
        value: (row: MonthRow) => row.previous,
      }
    : undefined,
)

type ModeRow = (typeof conso.adminModes.data)[number]
const donutColors = ['series-1', 'var(--nut-dash-muted)', 'series-2', 'series-3']
const donutColor = (_row: unknown, index: number) => donutColors[index % donutColors.length]

type BillingRow = (typeof conso.billing.data)[number]
const billingSeries = [
  { color: 'series-1', key: 'billed', label: 'Facturé', value: (row: BillingRow) => row.billed },
  {
    axis: 'right' as const,
    color: 'series-3',
    key: 'margin',
    label: 'Marge nette',
    type: 'line' as const,
    value: (row: BillingRow) => row.margin,
  },
]
const billingAverage = computed(() => {
  const margins = conso.billing.data.flatMap((row) => (row.margin === null ? [] : [row.margin]))
  return margins.length ? sum(margins) / margins.length : 0
})

type CumulativeRow = { current: number | null; previous: number | null; month: MonthIndex }
const cumulativeSeries = computed(() => [
  {
    color: 'series-1',
    key: 'current',
    label: String(year.value),
    value: (row: CumulativeRow) => row.current,
  },
])
const cumulativeComparison = computed(() => ({
  color: 'series-2',
  key: 'previous',
  label: previousYear.value,
  value: (row: CumulativeRow) => row.previous,
}))

// Tracked product lines: widget-scoped param, URL-synced under the query.
const lines = conso.productLines
const trackedSeries = computed(() =>
  lines.params.tracked.map((id, index) => ({
    color: `series-${(index % 6) + 1}`,
    key: id,
    label: productLabel(id),
    value: (row: ProductLineMonth) => row[id] ?? null,
  })),
)
const productsOpen = ref(false)
const presetsOpen = ref(false)
function productLabel(id: ProductId) {
  return PRODUCTS.find((product) => product.id === id)?.label ?? id
}
function toggleProduct(id: ProductId) {
  const { tracked } = lines.params
  lines.params.tracked = tracked.includes(id)
    ? tracked.filter((entry) => entry !== id)
    : [...tracked, id]
}
function applyPreset(products: readonly ProductId[]) {
  lines.params.tracked = [...products]
  presetsOpen.value = false
}
const toast = useToast()
function savePreset() {
  presetsOpen.value = false
  toast.add({ color: 'neutral', title: 'Enregistrer la sélection courante comme préréglage' })
}

type MarginRow = (typeof conso.margin.data)[number]
const marginSeries = computed(() => [
  {
    color: 'series-3',
    key: 'margin',
    label: String(year.value),
    value: (row: MarginRow) => row.margin,
  },
])
const marginComparison = computed(() => ({
  color: 'series-2',
  key: 'previous',
  label: previousYear.value,
  value: (row: MarginRow) => row.previous,
}))

// --- Candidates blocks ----------------------------------------------------------------------

type RegistrationRow = (typeof cand.registrations.data)[number]
const registrationSeries = computed(() => [
  {
    color: 'series-1',
    key: 'current',
    label: String(year.value),
    value: (row: RegistrationRow) => row.current,
  },
])
const registrationComparison = computed(() => ({
  color: 'series-2',
  key: 'previous',
  label: previousYear.value,
  value: (row: RegistrationRow) => row.previous,
}))

type PerformanceRow = (typeof cand.performance.data)[number]
const performanceSeries = [
  {
    color: 'series-1',
    key: 'completion',
    label: 'Complétion',
    value: (row: PerformanceRow) => row.completion,
  },
  {
    color: 'series-4',
    key: 'completion3',
    label: 'Complétion 3 mois',
    value: (row: PerformanceRow) => row.completion3,
  },
  {
    color: 'series-2',
    key: 'success',
    label: 'Succès global',
    value: (row: PerformanceRow) => row.success,
  },
  {
    color: 'series-3',
    key: 'aboveA1',
    label: 'Niveau > A1',
    value: (row: PerformanceRow) => row.aboveA1,
  },
]
type CefrRow = (typeof cand.cefr.data)[number]
const cefrSeries = [
  { color: 'series-1', key: 'share', label: 'Part', value: (row: CefrRow) => row.share },
]

// --- Operations blocks ----------------------------------------------------------------------

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', weekday: 'short' })
const days = (value: number) => `${fmt1(value)} j`

/** `YYYY-MM-DD` of a local midnight: the URL form of the picked day. */
function isoDay(time: number) {
  const date = new Date(time)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
}
const pickedDay = computed(() => {
  const [dayYear, dayMonth, dayOfMonth] = (ops.params.day ?? '').split('-').map(Number)
  return dayYear && dayMonth && dayOfMonth
    ? dayFormat.format(new Date(dayYear, dayMonth - 1, dayOfMonth))
    : ''
})

// Comparison period: a view param with localized options; the chart adds its faded bars.
const COMPARISONS: readonly DashboardComparison[] = ['previous', 'year', 'none']
const comparisonLabel = (value: DashboardComparison) =>
  ops.options.compare.items.find((item) => item.value === value)?.label ?? value
const comparedTo = computed(() =>
  ops.params.compare === 'year' ? 'l’an dernier' : 'la période précédente',
)
const compareCaption = (value: string) => `contre ${value} sur ${comparedTo.value}`

// Drill-down: a bar narrows the accounts table to its day; the same bar clears it.
const dailySeries = computed<DashboardSeries<OperationsDay>[]>(() => [
  {
    color: 'series-1',
    compare: ops.params.compare === 'none' ? undefined : (row) => row.previous,
    compareLabel: ops.params.compare === 'year' ? 'Sessions (an dernier)' : undefined,
    key: 'sessions',
    label: 'Sessions',
    value: (row) => row.sessions,
  },
])
function pickDay({ row }: DashboardSelectEvent<OperationsDay>) {
  const day = isoDay(row.day)
  ops.params.day = ops.params.day === day ? undefined : day
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
// The table sort lives in the accounts query's widget params, so it is in the URL.
const accountsSort = computed<DashboardTableSort | null>({
  get: () => ({ direction: ops.accounts.params.order, key: ops.accounts.params.sort }),
  set: (next) => {
    ops.accounts.params.sort = next && isSortKey(next.key) ? next.key : 'sessions'
    ops.accounts.params.order = next?.direction ?? 'desc'
  },
})
function isSortKey(key: string): key is OperationsSortKey {
  return OPERATIONS_SORT_KEYS.some((entry) => entry === key)
}
function openAccount({ row }: DashboardSelectEvent<OperationsAccount>) {
  toast.add({
    color: 'neutral',
    description: `${nf(row.sessions)} sessions · ${fmt1(row.success)} % de réussite`,
    title: `Ouvrir ${row.name}`,
  })
}
// The accounts table: a segment tab (widget param), one picked account mirrored by the
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
      ops.accounts.params.segment === tab.value && ops.accounts.state === 'ready'
        ? ops.accounts.data.length
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
  <div ref="scroller" class="ex-dash">
    <div class="ex-dash-top" :data-stuck="stuck || undefined">
      <header class="ex-ph ex-ph--dash">
        <div class="min-w-0">
          <h1>Tableau de bord</h1>
          <p>
            {{ today }} ·
            <template v-if="dashboard.updatedAt">
              mis à jour <NutDashboardRelativeTime :value="dashboard.updatedAt" />
            </template>
            <template v-else>chargement…</template>
          </p>
        </div>

        <div class="dash-ctl">
          <div class="dash-ctl-l">
            <template v-if="dashboard.view.current === 'consumption'">
              <DashSeg v-model="conso.params.currency" :items="CURRENCIES" label="Devise" />
              <DashSeg v-model="dashboard.params.year" :items="YEARS" label="Année" />
              <DashPicker
                v-model:open="accountOptions.open"
                v-model:search="accountOptions.search"
                icon="i-lucide-building-2"
                title="Compte"
                searchable
                :label="accountLabel"
                :active="Boolean(conso.params.account)"
                @clear="conso.params.account = undefined"
                @more="accountOptions.hasMore && accountOptions.loadMore()"
              >
                <button
                  type="button"
                  class="dash-it"
                  :class="{ on: !conso.params.account }"
                  @click="pickAccount(undefined)"
                >
                  <UIcon name="i-lucide-users" class="dash-it-ic" />
                  <span>Tous les comptes</span>
                </button>
                <button
                  v-for="option in accountOptions.items"
                  :key="option.value"
                  type="button"
                  class="dash-it"
                  :class="{ on: conso.params.account === option.value }"
                  @click="pickAccount(option.value)"
                >
                  <span class="dash-it-av">{{ initials(option.label) }}</span>
                  <span>{{ option.label }}</span>
                </button>
                <div v-if="accountOptions.loading || accountOptions.loadingMore" class="dash-more">
                  Chargement…
                </div>
              </DashPicker>
              <button
                type="button"
                class="dash-chip"
                :class="{ on: conso.params.compare }"
                :aria-pressed="conso.params.compare"
                @click="conso.params.compare = !conso.params.compare"
              >
                <UIcon name="i-lucide-check" class="size-3" />
                Comparer à {{ previousYear }}
              </button>
            </template>

            <template v-else-if="dashboard.view.current === 'operations'">
              <DashSeg v-model="dashboard.params.year" :items="YEARS" label="Année" />
              <DashSeg
                v-model="ops.params.compare"
                :items="COMPARISONS"
                :format="comparisonLabel"
                label="Comparer à"
              />
              <button
                v-if="pickedDay"
                type="button"
                class="dash-chip on"
                :aria-label="`Retirer le filtre du ${pickedDay}`"
                @click="ops.params.day = undefined"
              >
                <UIcon name="i-lucide-calendar" class="size-3" />
                Journée du {{ pickedDay }}
                <UIcon name="i-lucide-x" class="size-3" />
              </button>
            </template>

            <template v-else>
              <DashSeg v-model="dashboard.params.year" :items="YEARS" label="Année" />
              <DashPicker
                icon="i-lucide-calendar"
                title="Mois"
                :label="monthsLabel"
                :active="cand.params.months.length > 0"
                @clear="cand.params.months = []"
              >
                <div class="dash-grid3">
                  <button
                    v-for="month in MONTH_INDEXES"
                    :key="month"
                    type="button"
                    class="dash-it"
                    :class="{ on: cand.params.months.includes(month) }"
                    @click="toggleMonth(month)"
                  >
                    <span class="dash-chk" :class="{ on: cand.params.months.includes(month) }">
                      <UIcon name="i-lucide-check" class="size-3" />
                    </span>
                    {{ MONTHS[month] }}
                  </button>
                </div>
                <template v-if="cand.params.months.length">
                  <div class="dash-hr" />
                  <button type="button" class="dash-it" @click="cand.params.months = []">
                    <UIcon name="i-lucide-x" class="dash-it-ic" />
                    <span>Effacer la sélection</span>
                  </button>
                </template>
              </DashPicker>
              <DashPicker
                v-model:search="certSearch"
                icon="i-lucide-building-2"
                title="Comptes"
                searchable
                :label="accountsLabel"
                :active="cand.params.accounts.length > 0"
                @clear="cand.params.accounts = []"
              >
                <button
                  v-for="row in certAccounts"
                  :key="row.id"
                  type="button"
                  class="dash-it"
                  :class="{ on: cand.params.accounts.includes(row.id) }"
                  @click="toggleCertAccount(row.id)"
                >
                  <span class="dash-chk" :class="{ on: cand.params.accounts.includes(row.id) }">
                    <UIcon name="i-lucide-check" class="size-3" />
                  </span>
                  <span>{{ row.name }}</span>
                </button>
                <template v-if="cand.params.accounts.length">
                  <div class="dash-hr" />
                  <button type="button" class="dash-it" @click="cand.params.accounts = []">
                    <UIcon name="i-lucide-x" class="dash-it-ic" />
                    <span>Effacer la sélection</span>
                  </button>
                </template>
              </DashPicker>
            </template>
          </div>
          <div class="dash-ctl-r">
            <NutDashboardRefresh
              v-if="dashboard.view.current === 'operations'"
              :dashboard
              :updated="false"
              size="md"
            />
            <button v-else type="button" class="dash-btn">
              <UIcon name="i-lucide-download" class="size-[15px]" />
              {{
                dashboard.view.current === 'consumption' ? 'Exporter' : 'Rapport de certification'
              }}
            </button>
          </div>
        </div>
      </header>

      <nav class="ex-dtabs" aria-label="Vues du tableau de bord">
        <button
          v-for="item in dashboard.view.items"
          :key="item.value"
          type="button"
          :class="{ on: dashboard.view.current === item.value }"
          :aria-current="dashboard.view.current === item.value ? 'page' : undefined"
          @click="dashboard.view.current = item.value"
        >
          {{ item.label }}
        </button>
      </nav>
    </div>

    <!-- Consommation -->
    <div v-if="dashboard.view.current === 'consumption'" class="ex-dash-content">
      <NutDashboardGrid variant="panels" columns="2 md:3 xl:5">
        <NutDashboardStat
          size="1"
          :source="conso.summary"
          label="Tests consommés"
          :value="(d) => nf(d.units)"
          :delta="(d) => change(d.units, d.unitsPrevious)"
          :delta-format="dl"
          :caption="(d) => `${nf(d.unitsPrevious)} sur la même période ${previousYear}`"
        />
        <NutDashboardStat
          size="1"
          :source="conso.summary"
          label="Tests facturés"
          :value="(d) => money(d.billed)"
          :delta="(d) => change(d.billed, d.billedPrevious)"
          :delta-format="dl"
          :caption="(d) => `${nf(d.billedUnits)} unités facturées`"
        />
        <NutDashboardStat
          size="1"
          :source="conso.summary"
          label="Prix moyen par test"
          :value="(d) => money(d.units ? d.billed / d.units : 0)"
          :delta="
            (d) =>
              d.units && d.unitsPrevious
                ? change(d.billed / d.units, d.billedPrevious / d.unitsPrevious)
                : null
          "
          :delta-format="dl"
          caption="facturé HT, toutes versions"
        />
        <NutDashboardStat
          size="1"
          :source="conso.summary"
          label="Marge nette"
          :value="(d) => `${fmt1(d.margin)} %`"
          :delta="(d) => (d.marginPrevious ? d.margin - d.marginPrevious : null)"
          :delta-format="(value) => `${sign(value)}${fmt1(Math.abs(value))} pts`"
          :caption="(d) => `${kmoney((d.billed * d.margin) / 100)} sur la période`"
        />
        <NutDashboardStat
          size="2 md:2 xl:1"
          :source="conso.summary"
          label="Comptes consommateurs"
          :value="(d) => nf(d.accounts)"
          :delta="(d) => d.accountsChange"
          :delta-format="(value) => `+${value}`"
          :caption="conso.params.account ? 'compte filtré' : 'au moins un test sur la période'"
        />
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardBarChart
          size="12 md:6 xl:8"
          :source="conso.months"
          title="Consommation de tests"
          :subtitle="`unités par mois · ${year}${conso.params.compare ? ` · pointillés ${previousYear}` : ''}`"
          :x="monthLabel"
          :series="consumptionSeries"
          :comparison="consumptionComparison"
          :format="nf"
        >
          <template #footer>
            <NutDashboardTotal
              label="Total"
              :value="`${nf(sum(conso.months.data.map((row) => row.used)))} unités`"
            />
          </template>
        </NutDashboardBarChart>
        <NutDashboardDonutChart
          size="12 md:6 xl:4"
          :source="conso.adminModes"
          title="Modes d’administration"
          subtitle="part des unités"
          layout="stacked"
          :label="(row: ModeRow) => row.label"
          :value="(row: ModeRow) => row.share"
          :text="(row: ModeRow) => percent(row.share)"
          :color="donutColor"
          :center="(rows) => nf(sum(rows.map((row) => row.units)))"
          center-label="unités"
        />
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardComboChart
          size="12 md:6 xl:8"
          :source="conso.billing"
          title="Facturation et marge"
          :subtitle="`montants HT en ${conso.params.currency} · marge nette en %`"
          :x="monthLabel"
          :series="billingSeries"
          :y-axis="{ format: kmoney }"
          :y2-axis="{ format: percent, max: 50 }"
        >
          <template #footer>
            <NutDashboardTotal
              label="Total facturé"
              :value="money(sum(conso.billing.data.map((row) => row.billed)))"
            />
            <NutDashboardTotal label="Marge moyenne" :value="`${fmt1(billingAverage)} %`" />
          </template>
        </NutDashboardComboChart>
        <NutDashboardLineChart
          size="12 md:6 xl:4"
          :source="conso.cumulative"
          title="Trajectoire cumulée"
          :subtitle="`unités cumulées · ${year} vs ${previousYear}`"
          :x="monthLabel"
          :series="cumulativeSeries"
          :comparison="cumulativeComparison"
          :format="kunits"
          area
        >
          <template #footer>
            <NutDashboardTotal
              :label="`Projection fin ${year}`"
              :value="`${nf(conso.projection.data ?? 0)} unités`"
            />
          </template>
        </NutDashboardLineChart>
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardBars
          size="12 md:6 xl:4"
          :source="conso.topProducts"
          title="Top produits"
          subtitle="part des unités"
          :label="(row) => row.label"
          :tag="(row) => row.version"
          :value="(row) => row.share"
          :meta="(row) => `${row.share} % · ${nf(row.units)}`"
          emphasis="first"
        >
          <template #header-right>
            <NuxtLink to="/forms" class="dash-link">
              Catalogue <UIcon name="i-lucide-chevron-right" class="size-[13px]" />
            </NuxtLink>
          </template>
        </NutDashboardBars>
        <NutDashboardList
          size="12 md:6 xl:4"
          :source="conso.topCountries"
          title="Top pays"
          subtitle="part des unités"
          leading="code"
          :leading-text="(row) => row.code"
          :label="(row) => row.name"
          :percent="(row) => row.share"
          :value="(row) => row.units"
          :format="nf"
        />
        <NutDashboardList
          size="12 md:12 xl:4"
          :source="conso.topAccounts"
          title="Top comptes"
          :subtitle="`unités · ${year}`"
          leading="avatar"
          :label="(row) => row.name"
          :description="(row) => row.type"
          :delta="(row) => row.change"
          :value="(row) => row.units"
          :format="nf"
        >
          <template #header-right>
            <NuxtLink to="/accounts" class="dash-link">
              Tous <UIcon name="i-lucide-chevron-right" class="size-[13px]" />
            </NuxtLink>
          </template>
        </NutDashboardList>
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardLineChart
          :source="lines"
          title="Consommation par produit"
          subtitle="unités mensuelles des produits suivis"
          :x="monthLabel"
          :series="trackedSeries"
          :format="nf"
          :height="280"
          :legend="false"
          :empty="{
            icon: 'i-lucide-chart-line',
            title: 'Aucun produit suivi',
            description: 'Ajoutez un produit ou chargez un préréglage.',
          }"
        >
          <template #header-right>
            <div class="flex items-center gap-1.5">
              <DashPicker
                v-model:open="productsOpen"
                variant="button"
                icon="i-lucide-plus"
                label="Ajouter un produit"
                title="Produits suivis"
              >
                <button
                  v-for="product in PRODUCTS"
                  :key="product.id"
                  type="button"
                  class="dash-it"
                  :class="{ on: lines.params.tracked.includes(product.id) }"
                  @click="toggleProduct(product.id)"
                >
                  <span class="dash-chk" :class="{ on: lines.params.tracked.includes(product.id) }">
                    <UIcon name="i-lucide-check" class="size-3" />
                  </span>
                  <span>{{ product.label }}</span>
                  <small class="font-mono">{{ product.version }}</small>
                </button>
              </DashPicker>
              <DashPicker
                v-model:open="presetsOpen"
                variant="button"
                icon="i-lucide-layers"
                label="Préréglages"
                title="Préréglages"
              >
                <button
                  v-for="preset in PRODUCT_PRESETS"
                  :key="preset.label"
                  type="button"
                  class="dash-it"
                  @click="applyPreset(preset.products)"
                >
                  <UIcon name="i-lucide-layers" class="dash-it-ic" />
                  <span>{{ preset.label }}</span>
                  <small>{{ preset.products.length }} produits</small>
                </button>
                <div class="dash-hr" />
                <button type="button" class="dash-it" @click="savePreset">
                  <UIcon name="i-lucide-plus" class="dash-it-ic" />
                  <span>Enregistrer la sélection courante</span>
                </button>
              </DashPicker>
            </div>
          </template>
          <template v-if="lines.params.tracked.length" #toolbar>
            <span v-for="(id, index) in lines.params.tracked" :key="id" class="dash-chip-tag">
              <i :style="{ background: `var(--nut-dash-s${(index % 6) + 1})` }" />
              {{ productLabel(id) }}
              <button
                type="button"
                :aria-label="`Retirer ${productLabel(id)}`"
                @click="toggleProduct(id)"
              >
                <UIcon name="i-lucide-x" class="size-2.5" />
              </button>
            </span>
          </template>
          <template v-if="trackedSeries.length" #footer>
            <NutDashboardTotal
              v-for="series in trackedSeries"
              :key="series.key"
              :label="series.label"
              :value="`${nf(sum(lines.data.map((row) => row[series.key])))} unités`"
            />
          </template>
        </NutDashboardLineChart>
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardStackBar
          size="12 xl:6"
          :source="conso.accountTypes"
          title="Répartition par type de compte"
          subtitle="part des unités"
          :label="(row) => row.label"
          :value="(row) => row.share"
          :text="(row) => percent(row.share)"
        />
        <NutDashboardLineChart
          size="12 xl:6"
          :source="conso.margin"
          title="Marge nette mensuelle"
          subtitle="en % du facturé"
          :x="monthLabel"
          :series="marginSeries"
          :comparison="marginComparison"
          :y-axis="{ format: percent, max: 50 }"
          :reference="{ value: 30 }"
          :height="200"
          :legend="false"
        />
      </NutDashboardGrid>
    </div>

    <!-- Candidats et certifications -->
    <div v-else-if="dashboard.view.current === 'candidates'" class="ex-dash-content">
      <NutDashboardGrid variant="panels" columns="2 md:3 xl:6">
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Inscrits"
          :value="(d) => nf(d.registered)"
          :caption="(d) => `${nf(d.delivered)} certificats délivrés`"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Taux de complétion"
          :value="(d) => pf(d.completion)"
          :delta="() => 2.4"
          :delta-format="pts"
          :caption="(d) => `à 3 mois : ${pf(d.completion3)}`"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Taux compromis"
          :value="(d) => pf(d.compromised)"
          :delta="() => -0.8"
          :delta-format="pts"
          invert-delta
          caption="sessions invalidées par la surveillance"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Succès global"
          :value="(d) => pf(d.success)"
          :delta="() => 1.1"
          :delta-format="pts"
          :caption="(d) => `niveau > A1 : ${pf(d.aboveA1)}`"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Passages sur site"
          :value="(d) => nf(d.onsite)"
          :caption="(d) => `${pf(d.onsiteShare)} des passages`"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Passages en ligne"
          :value="(d) => nf(d.online)"
          :caption="(d) => `${pf(d.onlineShare)} des passages`"
        />
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardLineChart
          size="12 md:6 xl:8"
          :source="cand.registrations"
          title="Inscriptions mensuelles"
          :subtitle="`dossiers créés · ${year}${year > 2024 ? ` · pointillés ${previousYear}` : ''}`"
          :x="monthLabel"
          :series="registrationSeries"
          :comparison="registrationComparison"
          :format="nf"
          area
        >
          <template #footer>
            <NutDashboardTotal
              label="Total"
              :value="`${nf(sum(cand.registrations.data.map((row) => row.current)))} dossiers`"
            />
          </template>
        </NutDashboardLineChart>
        <NutDashboardFunnel
          size="12 md:6 xl:4"
          :source="cand.funnel"
          title="Parcours de certification"
          subtitle="de l’inscription au certificat délivré"
          :label="(row) => row.label"
          :value="(row) => row.count"
          :format="nf"
          :colors="['series-2', 'series-3', 'series-1', 'series-1']"
        />
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardPairedBars
          size="12 md:6 xl:8"
          :source="cand.perAccount"
          title="Inscrits et délivrés par compte"
          subtitle="quinze premiers comptes"
          :label="(row) => row.name"
          :total="(row) => row.registered"
          :value="(row) => row.delivered"
          total-label="Inscrits"
          value-label="Délivrés"
          :format="nf"
          :colors="['series-4', 'series-1']"
          :row-key="(row) => row.id"
        />
        <NutDashboardDonutChart
          size="12 md:6 xl:4"
          :source="cand.proctoring"
          title="Répartition de la surveillance"
          subtitle="passages sur la période"
          layout="stacked"
          :label="(row) => row.label"
          :value="(row) => row.count"
          :text="(row) => nf(row.count)"
          :color="donutColor"
          :center="(rows) => nf(sum(rows.map((row) => row.count)))"
          center-label="passages"
        />
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardBarChart
          :source="cand.performance"
          title="Taux de performance par compte"
          subtitle="dix premiers comptes · objectif 80 %"
          :x="(row) => row.name"
          :x-format="shortLabel"
          :series="performanceSeries"
          :y-axis="{ format: percent, max: 100, ticks: 5 }"
          :reference="{ label: 'Objectif 80 %', position: 'start', value: 80 }"
          :height="300"
          :points="10"
        />
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels">
        <NutDashboardStackBar
          size="12 md:6 xl:4"
          :source="cand.edof"
          title="États EDOF"
          subtitle="dossiers CPF par état"
          :label="(row) => row.label"
          :value="(row) => row.share"
          :color="(row) => row.color"
          :text="(row) => `${row.share} % · ${nf(row.count)}`"
          :legend-columns="1"
        />
        <NutDashboardBarChart
          size="12 md:6 xl:4"
          :source="cand.cefr"
          title="Niveaux CECRL obtenus"
          subtitle="part des examens réussis"
          :x="(row) => row.level"
          :series="cefrSeries"
          :y-axis="{ format: percent, max: 40 }"
          :height="190"
          :legend="false"
          :points="6"
        />
        <NutDashboardBars
          size="12 md:12 xl:4"
          :source="cand.delay"
          title="Délai de délivrance"
          subtitle="entre réussite et certificat"
          :label="(row) => row.label"
          :value="(row) => row.share"
          :meta="(row) => `${row.share} % · ${nf(row.count)}`"
          emphasis="first"
        >
          <template #footer>
            <NutDashboardTotal label="Délai médian" value="9 jours" />
          </template>
        </NutDashboardBars>
      </NutDashboardGrid>
    </div>

    <!-- Opérations: every operational block, with the card menu and freshness on each grid -->
    <div v-else class="ex-dash-content">
      <NutDashboardGrid variant="panels" columns="2 xl:4">
        <NutDashboardStat
          size="1"
          :source="ops.kpis"
          label="Sessions sur 14 jours"
          :value="(d) => d.sessionsPeriod"
          :format="nf"
          :compare="(d) => d.sessionsPeriodPrevious"
          :compare-label="compareCaption"
          :delta-format="dl"
          :trend="(d) => d.sessionsTrend"
          trend-type="bars"
        />
        <NutDashboardStat
          size="1"
          :source="ops.kpis"
          label="Taux de réussite"
          :value="(d) => d.successRate * 100"
          :format="(value) => `${fmt1(value)} %`"
          :delta="
            (d) =>
              d.successPeriodPrevious === null
                ? null
                : (d.successRate - d.successPeriodPrevious) * 100
          "
          :delta-format="pts"
          :caption="
            (d) =>
              d.successPeriodPrevious === null
                ? undefined
                : compareCaption(pf(d.successPeriodPrevious))
          "
          :goal="(d) => d.successGoal * 100"
          :status="
            (d) =>
              d.successRate < d.successGoal
                ? { color: 'warning', label: 'Sous l’objectif' }
                : { color: 'success', label: 'Objectif atteint' }
          "
        />
        <NutDashboardStat
          size="1"
          :source="ops.kpis"
          label="Délai de correction"
          :value="(d) => d.correctionDelay"
          :format="days"
          :delta="(d) => change(d.correctionDelay, d.correctionPrevious)"
          :delta-format="dl"
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
          :source="ops.kpis"
          label="Certificats délivrés"
          :value="(d) => d.certificates"
          :format="nf"
          caption="ce mois-ci"
          :goal="(d) => d.certificatesGoal"
        />
      </NutDashboardGrid>

      <!-- A panels grid is one card split in panes: the chart and its period summary -->
      <NutDashboardGrid variant="panels" menu freshness>
        <NutDashboardBarChart
          size="12 xl:8"
          :source="ops.daily"
          title="Sessions par jour"
          subtitle="cliquez une journée pour filtrer les comptes"
          :x="(row) => row.day"
          :x-format="(value) => weekdayFormat.format(Number(value))"
          x-label="Journée"
          :series="dailySeries"
          :selected="(row) => isoDay(row.day) === ops.params.day"
          :points="14"
          :height="300"
          @select="pickDay"
        />
        <NutDashboardStats
          size="12 xl:4"
          :source="ops.kpis"
          title="Sur la période"
          subtitle="14 derniers jours"
          columns="1"
          :items="[
            {
              key: 'sessions',
              label: 'Sessions passées',
              icon: 'i-lucide-monitor-play',
              value: (d) => d.sessionsPeriod,
              format: nf,
              progress: (d) => (d.sessionsPeriod / 1_600) * 100,
            },
            {
              key: 'passed',
              label: 'Candidats reçus',
              icon: 'i-lucide-circle-check',
              color: 'success',
              value: (d) => d.passedPeriod,
              format: nf,
              progress: (d) => (d.passedPeriod / d.sessionsPeriod) * 100,
            },
            {
              key: 'retakes',
              label: 'À repasser',
              icon: 'i-lucide-rotate-ccw',
              color: 'warning',
              value: (d) => d.retakesPeriod,
              format: nf,
              status: () => ({ color: 'warning', label: 'À suivre' }),
            },
          ]"
          :actions="[{ label: 'Voir le rapport', placement: 'footer', to: '/accounts' }]"
        />
      </NutDashboardGrid>

      <NutDashboardGrid variant="panels" menu freshness>
        <NutDashboardAlerts
          size="12 xl:5"
          :source="ops.alerts"
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
          :source="ops.kpis"
          title="Objectif mensuel"
          subtitle="certificats délivrés"
          :value="(d) => d.certificates"
          :max="(d) => d.certificatesGoal * 1.1"
          :target="(d) => d.certificatesGoal"
          :format="nf"
          caption="certificats"
          :color="(_, share) => (share >= 1 / 1.1 ? 'success' : 'series-1')"
          :actions="[{ icon: 'i-lucide-target', label: 'Modifier', variant: 'ghost' }]"
        />
        <NutDashboardBarChart
          size="12 md:6 xl:4"
          :source="ops.certificatesByMonth"
          title="Certificats"
          :subtitle="`par mois · ${year}`"
          :x="(row) => MONTHS[row.month] ?? ''"
          :series="[{ key: 'value', label: 'Certificats', value: (row) => row.value }]"
          :format="nf"
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
          :source="ops.accounts"
          title="Performance par compte"
          :subtitle="pickedDay ? `journée du ${pickedDay}` : '14 derniers jours'"
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
            <NutDashboardTabs v-model="ops.accounts.params.segment" :items="segmentTabs" />
            <span v-if="pickedDay" class="dash-chip-tag">
              <UIcon name="i-lucide-calendar" class="size-3 text-(--ui-text-dimmed)" />
              Journée du {{ pickedDay }}
              <button
                type="button"
                :aria-label="`Retirer le filtre du ${pickedDay}`"
                @click="ops.params.day = undefined"
              >
                <UIcon name="i-lucide-x" class="size-2.5" />
              </button>
            </span>
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
          :source="ops.accounts"
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
          :source="ops.activity"
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
    </div>
  </div>
</template>

<style scoped>
.ex-dash {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.ex-dash-top {
  position: relative;
  z-index: 20;
  transition: box-shadow 0.18s ease;
}
@media (min-width: 1024px) {
  .ex-dash-top {
    position: sticky;
    top: 0;
  }
  .ex-dash-top[data-stuck] {
    box-shadow: 0 10px 24px -18px rgb(31 29 26 / 0.35);
  }
}
.ex-ph--dash {
  align-items: flex-start;
  padding: 22px 28px 20px;
}
.dash-ctl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px 12px;
  padding-top: 4px;
}
.dash-ctl-l {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.dash-ctl-r {
  display: flex;
  align-items: center;
  margin-left: 6px;
  padding-left: 12px;
  border-left: 1px solid var(--ui-border);
}
.dash-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: var(--ex-surface);
  color: var(--ex-ink-soft);
  font-size: 12.5px;
  font-weight: 500;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}
.dash-chip :deep(svg) {
  opacity: 0;
}
.dash-chip.on {
  border-color: var(--ex-accent-line);
  background: var(--ex-selection);
  color: var(--ui-text);
}
.dash-chip.on :deep(svg) {
  opacity: 1;
  color: var(--nut-dl-accent-ink);
}
.ex-dtabs {
  display: flex;
  gap: 2px;
  padding: 0 28px;
  background: var(--ex-surface);
  border-bottom: 1px solid var(--ui-border);
}
.ex-dtabs button {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ex-ink-soft);
}
.ex-dtabs button:hover,
.ex-dtabs button.on {
  color: var(--ui-text);
}
.ex-dtabs button.on::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: -1px;
  height: 2px;
  background: var(--ui-primary);
}
.ex-dash-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 28px 60px;
}
.dash-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--ex-ink-soft);
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
}
.dash-link:hover {
  color: var(--ui-text);
}
.dash-chip-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  padding: 0 6px 0 10px;
  border-radius: 999px;
  background: var(--ex-chip);
  color: var(--ex-ink);
  font-size: 12.5px;
  font-weight: 500;
}
.dash-chip-tag i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.dash-chip-tag button {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: var(--ui-text-dimmed);
}
.dash-chip-tag button:hover {
  background: var(--ui-border-accented);
  color: var(--ui-text);
}
@media (max-width: 1023px) {
  .ex-ph--dash {
    padding: 16px 16px 12px;
  }
  .dash-ctl {
    justify-content: flex-start;
  }
  .ex-dtabs {
    overflow-x: auto;
    padding: 0 16px;
    scrollbar-width: none;
  }
  .ex-dash-content {
    padding: 16px 16px 48px;
    gap: 16px;
  }
}
</style>

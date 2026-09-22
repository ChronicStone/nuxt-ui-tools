<script setup lang="ts">
import { useMediaQuery, useNow, useScroll } from '@vueuse/core'

import { useDashboard, useDashboardFormat } from '#ui-tools/dashboard'
import type {
  DashboardMenuContext,
  DashboardRowAction,
  DashboardSelectEvent,
  DashboardSeries,
  DashboardTableColumn,
  DashboardTableSort,
} from '#ui-tools/dashboard'

import { analyticsDashboard, OPERATIONS_SORT_KEYS } from '../dashboards/analytics'
import type { OperationsSortKey } from '../dashboards/analytics'
import { initials, MONTHS } from '../data/dashboard'
import type {
  MonthIndex,
  OperationsAccount,
  OperationsAlert,
  OperationsDay,
  OperationsEvent,
  OperationsEventKind,
  ProductLineMonth,
} from '../data/dashboard'

const dashboard = useDashboard(analyticsDashboard)
const conso = dashboard.consumption
const cand = dashboard.candidates
const ops = dashboard.operations
const format = useDashboardFormat()
const toast = useToast()

// --- Formats (fr-FR, from the dashboard locale) ---------------------------------------------

const money = computed<Intl.NumberFormatOptions>(() => ({
  currency: conso.params.currency,
  maximumFractionDigits: 0,
  style: 'currency',
}))
const compactMoney = computed<Intl.NumberFormatOptions>(() => ({
  ...money.value,
  notation: 'compact',
}))
const days = (value: number) => `${format.decimal(value)} j`
const monthLabel = (row: { month: MonthIndex }) => MONTHS[row.month]
const shortLabel = (value: string | number | Date) => {
  const text = String(value)
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
}
const sum = (values: readonly (number | null | undefined)[]) =>
  values.reduce<number>((total, value) => total + (value ?? 0), 0)

const year = computed(() => dashboard.params.year)
const previousYear = computed(() => String(dashboard.params.year - 1))

// --- Header ----------------------------------------------------------------------------------

// The title scrolls away; the tabs and the filter bar stay pinned, with a shadow once content
// scrolls under them.
const scroller = useTemplateRef<HTMLElement>('scroller')
const head = useTemplateRef<HTMLElement>('head')
const { y: scrollY } = useScroll(scroller)
const stuck = computed(() => scrollY.value > 0 && scrollY.value >= (head.value?.offsetHeight ?? 0))

// Page actions keep their label from the small breakpoint up; phones get icon buttons.
const wide = useMediaQuery('(min-width: 640px)')
const pageAction = computed(() =>
  dashboard.view.current === 'consumption' ? 'Exporter' : 'Rapport de certification',
)

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

// Tracked product lines: a widget param with its presets; its handle feeds the picker and chips.
const lines = conso.productLines
const tracked = lines.filters.tracked
const trackedSeries = computed(() =>
  tracked.selected.map((product, index) => ({
    color: `series-${(index % 6) + 1}`,
    key: product.value,
    label: product.label,
    value: (row: ProductLineMonth) => row[product.value] ?? null,
  })),
)

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

const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', weekday: 'short' })

/** `YYYY-MM-DD` of a local midnight: the URL form of the picked day. */
function isoDay(time: number) {
  const date = new Date(time)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
}

// Comparison period: a view param with localized options; the chart adds its faded bars.
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
    description: `${format.integer(row.sessions)} sessions · ${format.percent(row.success)} de réussite`,
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
    <header ref="head" class="ex-ph ex-ph--dash">
      <h1>Tableau de bord</h1>
      <div class="dash-acts">
        <NutDashboardRefresh
          v-if="dashboard.view.current === 'operations'"
          :dashboard
          :updated="false"
          :label="wide"
          size="md"
        />
        <button
          v-else
          type="button"
          class="dash-btn"
          :class="{ 'dash-btn--icon': !wide }"
          :aria-label="wide ? undefined : pageAction"
        >
          <UIcon name="i-lucide-download" class="size-[15px]" />
          <template v-if="wide">{{ pageAction }}</template>
        </button>
      </div>
      <p>
        {{ today }} ·
        <template v-if="dashboard.updatedAt">
          mis à jour <NutDashboardRelativeTime :value="dashboard.updatedAt" />
        </template>
        <template v-else>chargement…</template>
      </p>
    </header>

    <div class="ex-dash-bar" :data-stuck="stuck || undefined">
      <NutDashboardViewTabs :dashboard class="px-2 lg:px-7" />
      <NutDashboardFilters :dashboard class="px-4 py-3 lg:px-7 lg:py-4" />
    </div>

    <!-- Consommation -->
    <div v-if="dashboard.view.current === 'consumption'" class="ex-dash-content">
      <NutDashboardGrid variant="panels" columns="2 md:3 xl:5">
        <NutDashboardStat
          size="1"
          :source="conso.summary"
          label="Tests consommés"
          :value="(d) => d.units"
          :compare="(d) => d.unitsPrevious"
          :compare-label="(value) => `${value} sur la même période ${previousYear}`"
          format="integer"
        />
        <NutDashboardStat
          size="1"
          :source="conso.summary"
          label="Tests facturés"
          :value="(d) => d.billed"
          :compare="(d) => d.billedPrevious"
          :format="money"
          :caption="(d) => `${format.integer(d.billedUnits)} unités facturées`"
        />
        <NutDashboardStat
          size="1"
          :source="conso.summary"
          label="Prix moyen par test"
          :value="(d) => (d.units ? d.billed / d.units : 0)"
          :compare="(d) => (d.unitsPrevious ? d.billedPrevious / d.unitsPrevious : null)"
          :format="money"
          caption="facturé HT, toutes versions"
        />
        <NutDashboardStat
          size="1"
          :source="conso.summary"
          label="Marge nette"
          :value="(d) => d.margin"
          :compare="(d) => d.marginPrevious || null"
          compare-mode="difference"
          format="percent"
          :caption="
            (d) =>
              `${format.currency((d.billed * d.margin) / 100, conso.params.currency, { notation: 'compact' })} sur la période`
          "
        />
        <NutDashboardStat
          size="2 md:2 xl:1"
          :source="conso.summary"
          label="Comptes consommateurs"
          :value="(d) => d.accounts"
          :delta="(d) => d.accountsChange"
          delta-format="signed"
          format="integer"
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
          format="integer"
        >
          <template #footer>
            <NutDashboardTotal
              label="Total"
              :value="`${format.integer(sum(conso.months.data.map((row) => row.used)))} unités`"
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
          :text="(row: ModeRow) => format.percent(row.share)"
          :color="donutColor"
          :center="(rows) => format.integer(sum(rows.map((row) => row.units)))"
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
          :y-axis="{ format: compactMoney }"
          :y2-axis="{ format: 'percent', max: 50 }"
        >
          <template #footer>
            <NutDashboardTotal
              label="Total facturé"
              :value="sum(conso.billing.data.map((row) => row.billed))"
              :format="money"
            />
            <NutDashboardTotal label="Marge moyenne" :value="billingAverage" format="percent" />
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
          format="compact"
          area
        >
          <template #footer>
            <NutDashboardTotal
              :label="`Projection fin ${year}`"
              :value="`${format.integer(conso.projection.data ?? 0)} unités`"
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
          :meta="(row) => `${format.percent(row.share)} · ${format.integer(row.units)}`"
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
          format="integer"
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
          format="integer"
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
          format="integer"
          totals
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
              <NutDashboardFilter
                :filter="tracked"
                variant="button"
                icon="i-lucide-plus"
                label="Ajouter un produit"
                list="options"
              />
              <NutDashboardFilter
                :filter="tracked"
                variant="button"
                icon="i-lucide-layers"
                label="Préréglages"
                list="presets"
              />
            </div>
          </template>
          <template v-if="tracked.selected.length" #toolbar>
            <span
              v-for="(product, index) in tracked.selected"
              :key="product.value"
              class="dash-chip-tag"
            >
              <i :style="{ background: `var(--nut-dash-s${(index % 6) + 1})` }" />
              {{ product.label }}
              <button
                type="button"
                :aria-label="`Retirer ${product.label}`"
                @click="tracked.toggle(product.value)"
              >
                <UIcon name="i-lucide-x" class="size-2.5" />
              </button>
            </span>
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
          :text="(row) => format.percent(row.share)"
        />
        <NutDashboardLineChart
          size="12 xl:6"
          :source="conso.margin"
          title="Marge nette mensuelle"
          subtitle="en % du facturé"
          :x="monthLabel"
          :series="marginSeries"
          :comparison="marginComparison"
          :y-axis="{ format: 'percent', max: 50 }"
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
          :value="(d) => d.registered"
          format="integer"
          :caption="(d) => `${format.integer(d.delivered)} certificats délivrés`"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Taux de complétion"
          :value="(d) => d.completion"
          format="ratio"
          :delta="() => 2.4"
          delta-format="points"
          :caption="(d) => `à 3 mois : ${format.ratio(d.completion3)}`"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Taux compromis"
          :value="(d) => d.compromised"
          format="ratio"
          :delta="() => -0.8"
          delta-format="points"
          invert-delta
          caption="sessions invalidées par la surveillance"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Succès global"
          :value="(d) => d.success"
          format="ratio"
          :delta="() => 1.1"
          delta-format="points"
          :caption="(d) => `niveau > A1 : ${format.ratio(d.aboveA1)}`"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Passages sur site"
          :value="(d) => d.onsite"
          format="integer"
          :caption="(d) => `${format.ratio(d.onsiteShare)} des passages`"
        />
        <NutDashboardStat
          size="1"
          :source="cand.summary"
          label="Passages en ligne"
          :value="(d) => d.online"
          format="integer"
          :caption="(d) => `${format.ratio(d.onlineShare)} des passages`"
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
          format="integer"
          area
        >
          <template #footer>
            <NutDashboardTotal
              label="Total"
              :value="`${format.integer(sum(cand.registrations.data.map((row) => row.current)))} dossiers`"
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
          format="integer"
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
          format="integer"
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
          :text="(row) => format.integer(row.count)"
          :color="donutColor"
          :center="(rows) => format.integer(sum(rows.map((row) => row.count)))"
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
          :y-axis="{ format: 'percent', max: 100, ticks: 5 }"
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
          :text="(row) => `${format.percent(row.share)} · ${format.integer(row.count)}`"
          :legend-columns="1"
        />
        <NutDashboardBarChart
          size="12 md:6 xl:4"
          :source="cand.cefr"
          title="Niveaux CECRL obtenus"
          subtitle="part des examens réussis"
          :x="(row) => row.level"
          :series="cefrSeries"
          :y-axis="{ format: 'percent', max: 40 }"
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
          :meta="(row) => `${format.percent(row.share)} · ${format.integer(row.count)}`"
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
          format="integer"
          :compare="(d) => d.sessionsPeriodPrevious"
          :compare-label="compareCaption"
          :trend="(d) => d.sessionsTrend"
          trend-type="bars"
        />
        <NutDashboardStat
          size="1"
          :source="ops.kpis"
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
          :source="ops.kpis"
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
          :source="ops.kpis"
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
          format="integer"
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
          :source="ops.accounts"
          title="Performance par compte"
          :subtitle="ops.params.day ? `journée du ${ops.filters.day.display}` : '14 derniers jours'"
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
            <span v-if="ops.params.day" class="dash-chip-tag">
              <UIcon name="i-lucide-calendar" class="size-3 text-(--ui-text-dimmed)" />
              Journée du {{ ops.filters.day.display }}
              <button
                type="button"
                :aria-label="`Retirer le filtre du ${ops.filters.day.display}`"
                @click="ops.filters.day.reset()"
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
/* Title and page actions on one row, the date line beneath across the full width. */
.ex-ph--dash {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0 16px;
  padding: 22px 28px 18px;
}
.ex-ph--dash p {
  grid-column: 1 / -1;
}
/* As tall as the refresh group, so switching views never shifts the title row. */
.dash-acts {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}
/* Header action: a 32px outlined button on the panel surface; phones get the icon alone. */
.dash-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--ui-border);
  border-radius: 7px;
  background: var(--ex-surface);
  color: var(--ui-text);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.12s;
}
.dash-btn:hover {
  background: var(--ex-row-hover);
}
.dash-btn--icon {
  width: 32px;
  padding: 0;
}
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
/* Tabs and filters stay pinned while the title scrolls away. */
.ex-dash-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--ex-page);
  transition: box-shadow 0.18s ease;
}
.ex-dash-bar[data-stuck] {
  box-shadow: 0 10px 24px -18px rgb(31 29 26 / 0.35);
}
.ex-dash-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px 28px 60px;
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
    padding: 16px 16px 14px;
  }
  .ex-dash-content {
    padding: 4px 16px 48px;
    gap: 16px;
  }
}
</style>

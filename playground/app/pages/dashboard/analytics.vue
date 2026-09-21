<script setup lang="ts">
import { useDashboard } from '#ui-tools/dashboard'

import { analyticsDashboard } from '../../lib/dashboards/analytics-dashboard'
import {
  DASHBOARD_PRODUCT_PRESETS,
  DASHBOARD_PRODUCTS,
  DASHBOARD_YEARS,
  monthLabel,
} from '../../lib/demo-dashboard-api'
import type { DashboardProduct, ProductLineMonth } from '../../lib/demo-dashboard-api'

const dashboard = useDashboard(analyticsDashboard)
const conso = dashboard.consumption
const candidates = dashboard.candidates

const numberFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })
const percentFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 1, style: 'percent' })
const nf = (value: number) => numberFormat.format(value)
const pf = (value: number) => percentFormat.format(value)
const money = (value: number) =>
  new Intl.NumberFormat('en', {
    currency: conso.params.currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
const kmoney = (value: number) =>
  new Intl.NumberFormat('en', {
    currency: conso.params.currency,
    maximumFractionDigits: 0,
    notation: 'compact',
    style: 'currency',
  }).format(value)
const change = (current: number, previous: number) =>
  previous ? ((current - previous) / previous) * 100 : null
const month = (row: { month: number }) => monthLabel(row.month)

const previousYear = computed(() => String(dashboard.params.year - 1))

const trackedSeries = computed(() =>
  conso.productLines.params.tracked.map((product) => ({
    key: product,
    label: DASHBOARD_PRODUCTS.find((entry) => entry.value === product)?.label ?? product,
    value: (row: ProductLineMonth) => row[product] ?? null,
  })),
)
const untrackedProducts = computed(() =>
  DASHBOARD_PRODUCTS.filter(
    (product) => !conso.productLines.params.tracked.includes(product.value),
  ).map((product) => ({
    label: product.label,
    onSelect: () => {
      conso.productLines.params.tracked = [...conso.productLines.params.tracked, product.value]
    },
  })),
)
const presetItems = DASHBOARD_PRODUCT_PRESETS.map((preset) => ({
  label: preset.label,
  onSelect: () => {
    conso.productLines.params.tracked = [...preset.products]
  },
}))

function untrack(product: DashboardProduct) {
  conso.productLines.params.tracked = conso.productLines.params.tracked.filter(
    (entry) => entry !== product,
  )
}

function productTotal(product: DashboardProduct) {
  return conso.productLines.data.reduce((total, row) => total + (row[product] ?? 0), 0)
}
</script>

<template>
  <PlaygroundContent mode="document">
    <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Dashboard</h1>
          <p class="mt-1 text-sm text-muted">
            Typed URL params, staged queries, derived values, and state-aware blocks.
          </p>
        </div>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          label="Refresh"
          :loading="dashboard.refreshing"
          @click="dashboard.refresh()"
        />
      </header>

      <UTabs
        v-model="dashboard.view.current"
        :items="[...dashboard.view.items]"
        :content="false"
        variant="link"
      />

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="dashboard.view.current === 'consumption'">
            <UFieldGroup>
              <UButton
                v-for="item in conso.options.currency.items"
                :key="item.value"
                :label="item.label"
                :icon="item.icon"
                color="neutral"
                :variant="conso.params.currency === item.value ? 'solid' : 'outline'"
                @click="conso.params.currency = item.value === 'USD' ? 'USD' : 'EUR'"
              />
            </UFieldGroup>
          </template>

          <UFieldGroup>
            <UButton
              v-for="year in DASHBOARD_YEARS"
              :key="year"
              :label="String(year)"
              color="neutral"
              :variant="dashboard.params.year === year ? 'solid' : 'outline'"
              @click="dashboard.params.year = year"
            />
          </UFieldGroup>

          <template v-if="dashboard.view.current === 'consumption'">
            <USelectMenu
              v-model="conso.params.account"
              v-bind="conso.options.account.menu"
              placeholder="All accounts"
              icon="i-lucide-building-2"
              clear
              class="w-60"
            >
              <template #content-bottom>
                <UButton
                  v-if="conso.options.account.hasMore"
                  block
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  label="Load more"
                  :loading="conso.options.account.loadingMore"
                  @click="conso.options.account.loadMore()"
                />
              </template>
            </USelectMenu>
            <UButton
              :icon="conso.params.compare ? 'i-lucide-check' : 'i-lucide-git-compare'"
              :label="`Compare with ${previousYear}`"
              color="neutral"
              :variant="conso.params.compare ? 'soft' : 'outline'"
              @click="conso.params.compare = !conso.params.compare"
            />
          </template>

          <template v-else>
            <USelectMenu
              v-model="candidates.params.months"
              v-bind="candidates.options.months.menu"
              multiple
              placeholder="All months"
              icon="i-lucide-calendar"
              class="w-48"
            />
            <USelectMenu
              v-model="candidates.params.accounts"
              v-bind="candidates.options.accounts.menu"
              multiple
              placeholder="All accounts"
              icon="i-lucide-building-2"
              class="w-60"
            />
          </template>
        </div>
        <UButton color="neutral" variant="outline" icon="i-lucide-download" label="Export" />
      </div>

      <!-- Consumption -->
      <NutDashboardGrid v-if="dashboard.view.current === 'consumption'">
        <NutDashboardGrid columns="1 sm:2 lg:3 xl:5">
          <NutDashboardStat
            size="1"
            :source="conso.summary"
            label="Tests consumed"
            :value="(d) => d.units"
            :format="nf"
            :delta="(d) => change(d.units, d.unitsPrevious)"
            :caption="(d) => `${nf(d.unitsPrevious)} over the same period ${previousYear}`"
          />
          <NutDashboardStat
            size="1"
            :source="conso.summary"
            label="Tests billed"
            :value="(d) => money(d.billed)"
            :delta="(d) => change(d.billed, d.billedPrevious)"
            :caption="(d) => `${nf(d.units * 0.965)} units billed`"
          />
          <NutDashboardStat
            size="1"
            :source="conso.summary"
            label="Average price per test"
            :value="(d) => money(d.billed / d.units)"
            :delta="(d) => change(d.billed / d.units, d.billedPrevious / d.unitsPrevious)"
            caption="billed excl. tax, all versions"
          />
          <NutDashboardStat
            size="1"
            :source="conso.summary"
            label="Net margin"
            :value="(d) => pf(d.margin / 100)"
            :delta="(d) => d.margin - d.marginPrevious"
            :delta-format="(v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)} pts`"
            :caption="(d) => `${kmoney((d.billed * d.margin) / 100)} over the period`"
          />
          <NutDashboardStat
            size="1"
            :source="conso.summary"
            label="Consuming accounts"
            :value="(d) => d.accounts"
            :delta="() => (conso.params.account ? null : 6.1)"
            :caption="
              conso.params.account ? 'filtered account' : 'at least one test over the period'
            "
          />
        </NutDashboardGrid>

        <NutDashboardBarChart
          size="12 xl:8"
          :source="conso.months"
          title="Test consumption"
          :subtitle="`units per month · ${dashboard.params.year}`"
          :x="month"
          :series="[
            { key: 'used', label: 'Consumed', value: (row) => row.used },
            { key: 'billed', label: 'Billed', value: (row) => row.billed, color: 'series-4' },
          ]"
          :comparison="
            conso.params.compare
              ? { key: 'previous', label: previousYear, value: (row) => row.previous }
              : undefined
          "
          :format="nf"
        >
          <template #footer>
            <NutDashboardTotal
              label="Total"
              :value="`${nf(conso.months.data.reduce((total, row) => total + row.used, 0))} units`"
            />
          </template>
        </NutDashboardBarChart>

        <NutDashboardDonutChart
          size="12 md:6 xl:4"
          :source="conso.adminModes"
          title="Administration modes"
          subtitle="share of units"
          :label="(row) => row.label"
          :value="(row) => row.share"
          :center="() => (conso.summary.data ? nf(conso.summary.data.units) : '')"
          center-label="units"
        />

        <NutDashboardComboChart
          size="12 xl:8"
          :source="conso.billing"
          title="Billing and margin"
          :subtitle="`amounts excl. tax in ${conso.params.currency} · net margin in %`"
          :x="month"
          :series="[
            { key: 'billed', label: 'Billed', value: (row) => row.billed },
            {
              key: 'margin',
              label: 'Net margin',
              value: (row) => row.margin,
              type: 'line',
              axis: 'right',
              color: 'series-3',
            },
          ]"
          :y-axis="{ format: kmoney }"
          :y2-axis="{ format: (v) => `${v} %`, max: 50 }"
        >
          <template #footer>
            <NutDashboardTotal label="Total billed" :value="money(conso.billedTotal.data)" />
            <NutDashboardTotal label="Average margin" :value="pf(conso.averageMargin.data / 100)" />
          </template>
        </NutDashboardComboChart>

        <NutDashboardLineChart
          size="12 md:6 xl:4"
          :source="conso.cumulative"
          title="Cumulative trajectory"
          :subtitle="`${dashboard.params.year} vs ${previousYear}`"
          :x="month"
          area
          :series="[
            { key: 'current', label: String(dashboard.params.year), value: (row) => row.current },
          ]"
          :comparison="{ key: 'previous', label: previousYear, value: (row) => row.previous }"
          :format="nf"
        >
          <template #footer>
            <NutDashboardTotal
              :label="`Projection end of ${dashboard.params.year}`"
              :value="`${nf(conso.projection.data)} units`"
            />
          </template>
        </NutDashboardLineChart>

        <NutDashboardBars
          size="12 md:6 xl:4"
          :source="conso.topProducts"
          title="Top products"
          subtitle="share of units"
          :label="(row) => row.label"
          :tag="(row) => row.version"
          :value="(row) => row.share"
          :meta="(row) => `${row.share} %`"
        >
          <template #header-right>
            <ULink to="#" class="text-xs font-medium text-muted hover:text-default"
              >Catalogue</ULink
            >
          </template>
        </NutDashboardBars>

        <NutDashboardList
          size="12 md:6 xl:4"
          :source="conso.topCountries"
          title="Top countries"
          subtitle="share of units"
          leading="code"
          :leading-text="(row) => row.code"
          :label="(row) => row.name"
          :percent="(row) => row.share"
          :value="(row) => ((conso.summary.data?.units ?? 0) * row.share) / 100"
          :format="nf"
        />

        <NutDashboardList
          size="12 xl:4"
          :source="conso.topAccounts"
          title="Top accounts"
          :subtitle="`units · ${dashboard.params.year}`"
          leading="avatar"
          :label="(row) => row.name"
          :description="(row) => row.kind"
          :delta="(row) => row.change"
          :value="(row) => row.units"
          :format="nf"
          :row-key="(row) => row.id"
        />

        <NutDashboardLineChart
          :source="conso.productLines"
          title="Consumption per product"
          subtitle="monthly units of tracked products"
          :x="month"
          :series="trackedSeries"
          :legend="false"
          :height="280"
          :empty="{
            icon: 'i-lucide-chart-line',
            title: 'No tracked product',
            description: 'Add one or load a preset.',
          }"
        >
          <template #header-right>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge
                v-for="(item, index) in trackedSeries"
                :key="item.key"
                color="neutral"
                variant="outline"
                class="gap-1.5"
              >
                <span
                  class="size-2 rounded-[2px]"
                  :style="{ background: `var(--nut-dash-s${(index % 6) + 1})` }"
                />
                {{ item.label }}
                <UButton
                  icon="i-lucide-x"
                  size="xs"
                  variant="link"
                  color="neutral"
                  class="-me-1 p-0"
                  :aria-label="`Stop tracking ${item.label}`"
                  @click="untrack(item.key)"
                />
              </UBadge>
              <UDropdownMenu :items="untrackedProducts">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-plus"
                  label="Add a product"
                />
              </UDropdownMenu>
              <UDropdownMenu :items="presetItems">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-layers"
                  label="Presets"
                />
              </UDropdownMenu>
            </div>
          </template>
          <template #footer>
            <NutDashboardTotal
              v-for="item in trackedSeries"
              :key="item.key"
              :label="item.label"
              :value="`${nf(productTotal(item.key))} units`"
            />
          </template>
        </NutDashboardLineChart>

        <NutDashboardStackBar
          size="12 lg:6"
          :source="conso.accountTypes"
          title="Split by account type"
          subtitle="share of units"
          :label="(row) => row.label"
          :value="(row) => row.share"
        />

        <NutDashboardLineChart
          size="12 lg:6"
          :source="conso.margin"
          title="Monthly net margin"
          subtitle="% of billed"
          :x="month"
          :series="[
            {
              key: 'margin',
              label: String(dashboard.params.year),
              value: (row) => row.margin,
              color: 'series-3',
            },
          ]"
          :comparison="{ key: 'previous', label: previousYear, value: (row) => row.previous }"
          :y-axis="{ format: (v) => `${v} %`, max: 50 }"
          :reference="{ value: 30, label: 'Target 30 %' }"
          :height="200"
        />
      </NutDashboardGrid>

      <!-- Candidates -->
      <NutDashboardGrid v-else>
        <NutDashboardGrid columns="1 sm:2 lg:3 xl:6">
          <NutDashboardStat
            size="1"
            :source="candidates.summary"
            label="Registered"
            :value="(d) => d.registered"
            :format="nf"
            :caption="(d) => `${nf(d.delivered)} certificates delivered`"
          />
          <NutDashboardStat
            size="1"
            :source="candidates.summary"
            label="Completion rate"
            :value="(d) => pf(d.completion)"
            :delta="() => 2.4"
            :delta-format="(v) => `+${v} pts`"
            :caption="(d) => `at 3 months: ${pf(d.completion3)}`"
          />
          <NutDashboardStat
            size="1"
            :source="candidates.summary"
            label="Compromised rate"
            :value="(d) => pf(d.compromised)"
            :delta="() => -0.8"
            :delta-format="(v) => `${v} pt`"
            invert-delta
            caption="sessions invalidated by proctoring"
          />
          <NutDashboardStat
            size="1"
            :source="candidates.summary"
            label="Overall success"
            :value="(d) => pf(d.success)"
            :delta="() => 1.1"
            :delta-format="(v) => `+${v} pt`"
            :caption="(d) => `level above A1: ${pf(d.aboveA1)}`"
          />
          <NutDashboardStat
            size="1"
            :source="candidates.summary"
            label="On-site sessions"
            :value="(d) => d.onsite"
            :format="nf"
            :caption="(d) => `${pf(d.onsite / (d.onsite + d.online))} of sessions`"
          />
          <NutDashboardStat
            size="1"
            :source="candidates.summary"
            label="Online sessions"
            :value="(d) => d.online"
            :format="nf"
            :caption="(d) => `${pf(d.online / (d.onsite + d.online))} of sessions`"
          />
        </NutDashboardGrid>

        <NutDashboardLineChart
          size="12 xl:8"
          :source="candidates.registrations"
          title="Monthly registrations"
          :subtitle="`files created · ${dashboard.params.year}`"
          :x="month"
          area
          :series="[
            { key: 'current', label: String(dashboard.params.year), value: (row) => row.current },
          ]"
          :comparison="{ key: 'previous', label: previousYear, value: (row) => row.previous }"
          :format="nf"
        >
          <template #footer>
            <NutDashboardTotal label="Total" :value="`${nf(candidates.registered.data)} files`" />
          </template>
        </NutDashboardLineChart>

        <NutDashboardFunnel
          size="12 md:6 xl:4"
          :source="candidates.funnel"
          title="Certification journey"
          subtitle="from registration to certificate"
          :label="(row) => row.label"
          :value="(row) => row.count"
          :format="nf"
        />

        <NutDashboardPairedBars
          size="12 xl:8"
          :source="candidates.perAccount"
          title="Registered and delivered per account"
          subtitle="first fifteen accounts"
          :label="(row) => row.name"
          :total="(row) => row.registered"
          :value="(row) => row.delivered"
          total-label="Registered"
          value-label="Delivered"
          :format="nf"
          :limit="15"
        />

        <NutDashboardDonutChart
          size="12 md:6 xl:4"
          :source="candidates.proctoring"
          title="Proctoring split"
          subtitle="sessions over the period"
          :label="(row) => row.label"
          :value="(row) => row.count"
          :text="(row) => nf(row.count)"
          :center="(rows) => rows.reduce((total, row) => total + row.count, 0)"
          center-label="sessions"
        />

        <NutDashboardBarChart
          :source="candidates.performance"
          title="Performance per account"
          subtitle="first ten accounts · target 80 %"
          :x="(row) => row.name"
          :x-format="
            (value) =>
              String(value).length > 14 ? `${String(value).slice(0, 13)}…` : String(value)
          "
          :series="[
            { key: 'completion', label: 'Completion', value: (row) => row.completion },
            {
              key: 'completion3',
              label: 'Completion at 3 months',
              value: (row) => row.completion3,
              color: 'series-4',
            },
            {
              key: 'success',
              label: 'Overall success',
              value: (row) => row.success,
              color: 'series-2',
            },
            {
              key: 'aboveA1',
              label: 'Level above A1',
              value: (row) => row.aboveA1,
              color: 'series-3',
            },
          ]"
          :y-axis="{ format: (v) => `${v} %`, max: 100 }"
          :reference="{ value: 80, label: 'Target 80 %' }"
          :height="300"
        />

        <NutDashboardStackBar
          size="12 md:6 xl:4"
          :source="candidates.edof"
          title="EDOF states"
          subtitle="CPF files per state"
          :label="(row) => row.label"
          :value="(row) => row.share"
        />

        <NutDashboardBarChart
          size="12 md:6 xl:4"
          :source="candidates.cefr"
          title="CEFR levels obtained"
          subtitle="share of passed exams"
          :x="(row) => row.level"
          :series="[{ key: 'share', label: 'Share', value: (row) => row.share }]"
          :y-axis="{ format: (v) => `${v} %`, max: 40 }"
          :legend="false"
          :height="190"
        />

        <NutDashboardBars
          size="12 xl:4"
          :source="candidates.delay"
          title="Delivery delay"
          subtitle="between success and certificate"
          :label="(row) => row.label"
          :value="(row) => row.share"
          :meta="(row) => `${row.share} %`"
        >
          <template #footer>
            <NutDashboardTotal label="Median delay" value="9 days" />
          </template>
        </NutDashboardBars>
      </NutDashboardGrid>
    </div>
  </PlaygroundContent>
</template>

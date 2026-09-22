<script setup lang="ts">
import { useDashboardFormat, useDashboardView } from '#ui-tools/dashboard'

import { consumptionView } from '../../lib/dashboards/analytics/consumption'
import { DASHBOARD_PRODUCT_PRESETS, monthLabel } from '../../lib/demo-dashboard-api'
import type { ProductLineMonth } from '../../lib/demo-dashboard-api'

// The tab reads its view from the dashboard the page created: no props, fully typed.
const consumption = useDashboardView(consumptionView)
const format = useDashboardFormat()

const year = computed(() => consumption.params.year)
const previousYear = computed(() => String(consumption.params.year - 1))
const money = computed<Intl.NumberFormatOptions>(() => ({
  currency: consumption.params.currency,
  maximumFractionDigits: 0,
  style: 'currency',
}))
const compactMoney = computed<Intl.NumberFormatOptions>(() => ({
  ...money.value,
  notation: 'compact',
}))
const month = (row: { month: number }) => monthLabel(row.month)

const tracked = consumption.productLines.filters.tracked
const trackedSeries = computed(() =>
  tracked.selected.map((product) => ({
    key: product.value,
    label: product.label,
    value: (row: ProductLineMonth) => row[product.value] ?? null,
  })),
)
</script>

<template>
  <NutDashboardGrid>
    <NutDashboardGrid columns="1 sm:2 lg:3 xl:5">
      <NutDashboardStat
        size="1"
        :source="consumption.summary"
        label="Tests consumed"
        :value="(d) => d.units"
        :compare="(d) => d.unitsPrevious"
        :compare-label="(value) => `${value} over the same period ${previousYear}`"
        format="integer"
      />
      <NutDashboardStat
        size="1"
        :source="consumption.summary"
        label="Tests billed"
        :value="(d) => d.billed"
        :compare="(d) => d.billedPrevious"
        :format="money"
        :caption="(d) => `${format.integer(d.units * 0.965)} units billed`"
      />
      <NutDashboardStat
        size="1"
        :source="consumption.summary"
        label="Average price per test"
        :value="(d) => d.billed / d.units"
        :compare="(d) => d.billedPrevious / d.unitsPrevious"
        :format="money"
        caption="billed excl. tax, all versions"
      />
      <NutDashboardStat
        size="1"
        :source="consumption.summary"
        label="Net margin"
        :value="(d) => d.margin"
        :compare="(d) => d.marginPrevious"
        compare-mode="difference"
        format="percent"
        :caption="
          (d) =>
            `${format.currency((d.billed * d.margin) / 100, consumption.params.currency, { notation: 'compact' })} over the period`
        "
      />
      <NutDashboardStat
        size="1"
        :source="consumption.summary"
        label="Consuming accounts"
        :value="(d) => d.accounts"
        :delta="() => (consumption.params.account ? null : 6.1)"
        format="integer"
        :caption="
          consumption.params.account ? 'filtered account' : 'at least one test over the period'
        "
      />
    </NutDashboardGrid>

    <NutDashboardBarChart
      size="12 xl:8"
      :source="consumption.months"
      title="Test consumption"
      :subtitle="`units per month · ${year}`"
      :x="month"
      :series="[
        { key: 'used', label: 'Consumed', value: (row) => row.used },
        { key: 'billed', label: 'Billed', value: (row) => row.billed, color: 'series-4' },
      ]"
      :comparison="
        consumption.params.compare
          ? { key: 'previous', label: previousYear, value: (row) => row.previous }
          : undefined
      "
      format="integer"
      totals
    />

    <NutDashboardDonutChart
      size="12 md:6 xl:4"
      :source="consumption.adminModes"
      title="Administration modes"
      subtitle="share of units"
      :label="(row) => row.label"
      :value="(row) => row.share"
      :center="
        () => (consumption.summary.data ? format.integer(consumption.summary.data.units) : '')
      "
      center-label="units"
    />

    <NutDashboardComboChart
      size="12 xl:8"
      :source="consumption.billing"
      title="Billing and margin"
      :subtitle="`amounts excl. tax in ${consumption.params.currency} · net margin in %`"
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
      :y-axis="{ format: compactMoney }"
      :y2-axis="{ format: 'percent', max: 50 }"
    >
      <template #footer>
        <NutDashboardTotal
          label="Total billed"
          :value="consumption.billedTotal.data"
          :format="money"
        />
        <NutDashboardTotal
          label="Average margin"
          :value="consumption.averageMargin.data"
          format="percent"
        />
      </template>
    </NutDashboardComboChart>

    <NutDashboardLineChart
      size="12 md:6 xl:4"
      :source="consumption.cumulative"
      title="Cumulative trajectory"
      :subtitle="`${year} vs ${previousYear}`"
      :x="month"
      area
      :series="[{ key: 'current', label: String(year), value: (row) => row.current }]"
      :comparison="{ key: 'previous', label: previousYear, value: (row) => row.previous }"
      format="integer"
    >
      <template #footer>
        <NutDashboardTotal
          :label="`Projection end of ${year}`"
          :value="consumption.projection.data"
          format="integer"
        />
      </template>
    </NutDashboardLineChart>

    <NutDashboardBars
      size="12 md:6 xl:4"
      :source="consumption.topProducts"
      title="Top products"
      subtitle="share of units"
      :label="(row) => row.label"
      :tag="(row) => row.version"
      :value="(row) => row.share"
      :meta="(row) => format.percent(row.share)"
    >
      <template #header-right>
        <ULink to="#" class="text-xs font-medium text-muted hover:text-default">Catalogue</ULink>
      </template>
    </NutDashboardBars>

    <NutDashboardList
      size="12 md:6 xl:4"
      :source="consumption.topCountries"
      title="Top countries"
      subtitle="share of units"
      leading="code"
      :leading-text="(row) => row.code"
      :label="(row) => row.name"
      :percent="(row) => row.share"
      :value="(row) => ((consumption.summary.data?.units ?? 0) * row.share) / 100"
      format="integer"
    />

    <NutDashboardList
      size="12 xl:4"
      :source="consumption.topAccounts"
      title="Top accounts"
      :subtitle="`units · ${year}`"
      leading="avatar"
      :label="(row) => row.name"
      :description="(row) => row.kind"
      :delta="(row) => row.change"
      :value="(row) => row.units"
      format="integer"
      :row-key="(row) => row.id"
    />

    <NutDashboardLineChart
      :source="consumption.productLines"
      title="Consumption per product"
      subtitle="monthly units of tracked products"
      :x="month"
      :series="trackedSeries"
      :legend="false"
      :height="280"
      format="integer"
      totals
      :empty="{
        icon: 'i-lucide-chart-line',
        title: 'No tracked product',
        description: 'Add one or load a preset.',
      }"
    >
      <template #header-right>
        <NutDashboardFilter
          :filter="tracked"
          variant="button"
          icon="i-lucide-plus"
          label="Products"
        >
          <template #footer>
            <div class="my-1 h-px bg-(--ui-border-muted)" />
            <UButton
              v-for="preset in DASHBOARD_PRODUCT_PRESETS"
              :key="preset.label"
              :label="preset.label"
              icon="i-lucide-layers"
              color="neutral"
              variant="ghost"
              size="xs"
              block
              class="justify-start"
              @click="tracked.value = [...preset.products].slice(0, tracked.max)"
            />
          </template>
        </NutDashboardFilter>
      </template>
      <template v-if="tracked.selected.length" #toolbar>
        <UBadge
          v-for="(product, index) in tracked.selected"
          :key="product.value"
          color="neutral"
          variant="outline"
          class="gap-1.5"
        >
          <span
            class="size-2 rounded-[2px]"
            :style="{ background: `var(--nut-dash-s${(index % 6) + 1})` }"
          />
          {{ product.label }}
          <UButton
            icon="i-lucide-x"
            size="xs"
            variant="link"
            color="neutral"
            class="-me-1 p-0"
            :aria-label="`Stop tracking ${product.label}`"
            @click="tracked.toggle(product.value)"
          />
        </UBadge>
      </template>
    </NutDashboardLineChart>

    <NutDashboardStackBar
      size="12 lg:6"
      :source="consumption.accountTypes"
      title="Split by account type"
      subtitle="share of units"
      :label="(row) => row.label"
      :value="(row) => row.share"
    />

    <NutDashboardLineChart
      size="12 lg:6"
      :source="consumption.margin"
      title="Monthly net margin"
      subtitle="% of billed"
      :x="month"
      :series="[
        { key: 'margin', label: String(year), value: (row) => row.margin, color: 'series-3' },
      ]"
      :comparison="{ key: 'previous', label: previousYear, value: (row) => row.previous }"
      :y-axis="{ format: 'percent', max: 50 }"
      :reference="{ value: 30, label: 'Target 30 %' }"
      :height="200"
    />
  </NutDashboardGrid>
</template>

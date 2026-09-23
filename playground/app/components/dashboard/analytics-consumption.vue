<script setup lang="ts">
import { useDashboardFormat, useDashboardView } from '#ui-tools/dashboard'

import { consumptionView } from '../../lib/dashboards/analytics/consumption'
import { monthLabel } from '../../lib/demo-dashboard-api'

// The tab reads its view from the dashboard the page created: no props, fully typed.
const consumption = useDashboardView(consumptionView)
const format = useDashboardFormat()

const year = computed(() => consumption.filters.year)
const previousYear = computed(() => String(consumption.filters.year - 1))
const month = (row: { month: number }) => monthLabel(row.month)
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
        :format="{ currency: consumption.filters.currency }"
        :caption="(d) => `${format.integer(d.units * 0.965)} units billed`"
      />
      <NutDashboardStat
        size="1"
        :source="consumption.summary"
        label="Average price per test"
        :value="(d) => d.billed / d.units"
        :compare="(d) => d.billedPrevious / d.unitsPrevious"
        :format="{ currency: consumption.filters.currency }"
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
            `${format.currency((d.billed * d.margin) / 100, consumption.filters.currency, { notation: 'compact' })} over the period`
        "
      />
      <NutDashboardStat
        size="1"
        :source="consumption.summary"
        label="Consuming accounts"
        :value="(d) => d.accounts"
        :delta="() => (consumption.filters.account ? null : 6.1)"
        format="integer"
        :caption="
          consumption.filters.account ? 'filtered account' : 'at least one test over the period'
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
        consumption.filters.compare
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
      :subtitle="`amounts excl. tax in ${consumption.filters.currency} · net margin in %`"
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
      :y-axis="{ format: { currency: consumption.filters.currency, notation: 'compact' } }"
      :y2-axis="{ format: 'percent', max: 50 }"
    >
      <template #footer>
        <NutDashboardTotal
          label="Total billed"
          :value="consumption.billedTotal.data"
          :format="{ currency: consumption.filters.currency }"
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
      :actions="[{ label: 'Catalogue', to: '#' }]"
    />

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
      :series="consumption.productLines.controls.tracked"
      :series-value="(row, product) => row[product] ?? null"
      :height="280"
      format="integer"
      totals
      :empty="{
        icon: 'i-lucide-chart-line',
        title: 'No tracked product',
        description: 'Add one or load a preset.',
      }"
    />

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

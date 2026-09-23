<script setup lang="ts">
import { useDashboardFormat, useDashboardView } from '#ui-tools/dashboard'

import { consumptionView } from '../../dashboards/analytics'
import { MONTHS, sum } from '../../data/dashboard'
import type { MonthIndex } from '../../data/dashboard'

const consumption = useDashboardView(consumptionView)
const format = useDashboardFormat()

const year = computed(() => consumption.filters.year)
const previousYear = computed(() => String(consumption.filters.year - 1))
const month = (row: { month: MonthIndex }) => MONTHS[row.month] ?? ''
const DONUT_COLORS = ['series-1', 'var(--nut-dash-muted)', 'series-2', 'series-3']
</script>

<template>
  <NutDashboardGrid variant="panels" columns="2 md:3 xl:5">
    <NutDashboardStat
      size="1"
      :source="consumption.summary"
      label="Tests consommés"
      :value="(d) => d.units"
      :compare="(d) => d.unitsPrevious"
      :compare-label="(value) => `${value} sur la même période ${previousYear}`"
      format="integer"
    />
    <NutDashboardStat
      size="1"
      :source="consumption.summary"
      label="Tests facturés"
      :value="(d) => d.billed"
      :compare="(d) => d.billedPrevious"
      :format="{ currency: consumption.filters.currency }"
      :caption="(d) => `${format.integer(d.billedUnits)} unités facturées`"
    />
    <NutDashboardStat
      size="1"
      :source="consumption.summary"
      label="Prix moyen par test"
      :value="(d) => (d.units ? d.billed / d.units : 0)"
      :compare="(d) => (d.unitsPrevious ? d.billedPrevious / d.unitsPrevious : null)"
      :format="{ currency: consumption.filters.currency }"
      caption="facturé HT, toutes versions"
    />
    <NutDashboardStat
      size="1"
      :source="consumption.summary"
      label="Marge nette"
      :value="(d) => d.margin"
      :compare="(d) => d.marginPrevious || null"
      compare-mode="difference"
      format="percent"
      :caption="
        (d) =>
          `${format.currency((d.billed * d.margin) / 100, consumption.filters.currency, { notation: 'compact' })} sur la période`
      "
    />
    <NutDashboardStat
      size="2 md:2 xl:1"
      :source="consumption.summary"
      label="Comptes consommateurs"
      :value="(d) => d.accounts"
      :delta="(d) => d.accountsChange"
      delta-format="signed"
      format="integer"
      :caption="consumption.filters.account ? 'compte filtré' : 'au moins un test sur la période'"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels">
    <NutDashboardBarChart
      size="12 md:6 xl:8"
      :source="consumption.months"
      title="Consommation de tests"
      :subtitle="`unités par mois · ${year}${consumption.filters.compare ? ` · pointillés ${previousYear}` : ''}`"
      :x="month"
      :series="[
        { color: 'series-1', key: 'used', label: 'Consommés', value: (row) => row.used },
        { color: 'series-4', key: 'billed', label: 'Facturés', value: (row) => row.billed },
      ]"
      :comparison="
        consumption.filters.compare
          ? {
              color: 'series-5',
              key: 'previous',
              label: previousYear,
              value: (row) => row.previous,
            }
          : undefined
      "
      format="integer"
      totals
    />
    <NutDashboardDonutChart
      size="12 md:6 xl:4"
      :source="consumption.adminModes"
      title="Modes d’administration"
      subtitle="part des unités"
      layout="stacked"
      :label="(row) => row.label"
      :value="(row) => row.share"
      :text="(row) => format.percent(row.share)"
      :color="(_, index) => DONUT_COLORS[index % DONUT_COLORS.length]"
      :center="(rows) => format.integer(sum(rows.map((row) => row.units)))"
      center-label="unités"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels">
    <NutDashboardComboChart
      size="12 md:6 xl:8"
      :source="consumption.billing"
      title="Facturation et marge"
      :subtitle="`montants HT en ${consumption.filters.currency} · marge nette en %`"
      :x="month"
      :series="[
        { color: 'series-1', key: 'billed', label: 'Facturé', value: (row) => row.billed },
        {
          axis: 'right',
          color: 'series-3',
          key: 'margin',
          label: 'Marge nette',
          type: 'line',
          value: (row) => row.margin,
        },
      ]"
      :y-axis="{ format: { currency: consumption.filters.currency, notation: 'compact' } }"
      :y2-axis="{ format: 'percent', max: 50 }"
    >
      <template #footer>
        <NutDashboardTotal
          label="Total facturé"
          :value="consumption.billedTotal.data"
          :format="{ currency: consumption.filters.currency }"
        />
        <NutDashboardTotal
          label="Marge moyenne"
          :value="consumption.averageMargin.data"
          format="percent"
        />
      </template>
    </NutDashboardComboChart>
    <NutDashboardLineChart
      size="12 md:6 xl:4"
      :source="consumption.cumulative"
      title="Trajectoire cumulée"
      :subtitle="`unités cumulées · ${year} vs ${previousYear}`"
      :x="month"
      :series="[
        { color: 'series-1', key: 'current', label: String(year), value: (row) => row.current },
      ]"
      :comparison="{
        color: 'series-2',
        key: 'previous',
        label: previousYear,
        value: (row) => row.previous,
      }"
      format="compact"
      area
    >
      <template #footer>
        <NutDashboardTotal
          :label="`Projection fin ${year}`"
          :value="`${format.integer(consumption.projection.data ?? 0)} unités`"
        />
      </template>
    </NutDashboardLineChart>
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels">
    <NutDashboardBars
      size="12 md:6 xl:4"
      :source="consumption.topProducts"
      title="Top produits"
      subtitle="part des unités"
      :label="(row) => row.label"
      :tag="(row) => row.version"
      :value="(row) => row.share"
      :meta="(row) => `${format.percent(row.share)} · ${format.integer(row.units)}`"
      emphasis="first"
      :actions="[{ label: 'Catalogue', to: '/forms' }]"
    />
    <NutDashboardList
      size="12 md:6 xl:4"
      :source="consumption.topCountries"
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
      :source="consumption.topAccounts"
      title="Top comptes"
      :subtitle="`unités · ${year}`"
      leading="avatar"
      :label="(row) => row.name"
      :description="(row) => row.type"
      :delta="(row) => row.change"
      :value="(row) => row.units"
      format="integer"
      :actions="[{ label: 'Tous', to: '/accounts' }]"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels">
    <NutDashboardLineChart
      :source="consumption.productLines"
      title="Consommation par produit"
      subtitle="unités mensuelles des produits suivis"
      :x="month"
      :series="consumption.productLines.controls.tracked"
      :series-value="(row, product) => row[product] ?? null"
      format="integer"
      totals
      :height="280"
      :empty="{
        icon: 'i-lucide-chart-line',
        title: 'Aucun produit suivi',
        description: 'Ajoutez un produit ou chargez un préréglage.',
      }"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels">
    <NutDashboardStackBar
      size="12 xl:6"
      :source="consumption.accountTypes"
      title="Répartition par type de compte"
      subtitle="part des unités"
      :label="(row) => row.label"
      :value="(row) => row.share"
      :text="(row) => format.percent(row.share)"
    />
    <NutDashboardLineChart
      size="12 xl:6"
      :source="consumption.margin"
      title="Marge nette mensuelle"
      subtitle="en % du facturé"
      :x="month"
      :series="[
        { color: 'series-3', key: 'margin', label: String(year), value: (row) => row.margin },
      ]"
      :comparison="{
        color: 'series-2',
        key: 'previous',
        label: previousYear,
        value: (row) => row.previous,
      }"
      :y-axis="{ format: 'percent', max: 50 }"
      :reference="{ value: 30 }"
      :height="200"
      :legend="false"
    />
  </NutDashboardGrid>
</template>

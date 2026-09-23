<script setup lang="ts">
import { useDashboardFormat, useDashboardView } from '#ui-tools/dashboard'

import { candidatesView } from '../../dashboards/analytics'
import { MONTHS, sum } from '../../data/dashboard'
import type { MonthIndex } from '../../data/dashboard'

const candidates = useDashboardView(candidatesView)
const format = useDashboardFormat()

const year = computed(() => candidates.filters.year)
const previousYear = computed(() => String(candidates.filters.year - 1))
const month = (row: { month: MonthIndex }) => MONTHS[row.month] ?? ''
const DONUT_COLORS = ['series-1', 'var(--nut-dash-muted)', 'series-2', 'series-3']

/** Account names are long: the performance chart truncates them on its axis. */
function shortLabel(value: string | number | Date) {
  const text = String(value)
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
}
</script>

<template>
  <NutDashboardGrid variant="panels" columns="2 md:3 xl:6">
    <NutDashboardStat
      size="1"
      :source="candidates.summary"
      label="Inscrits"
      :value="(d) => d.registered"
      format="integer"
      :caption="(d) => `${format.integer(d.delivered)} certificats délivrés`"
    />
    <NutDashboardStat
      size="1"
      :source="candidates.summary"
      label="Taux de complétion"
      :value="(d) => d.completion"
      format="ratio"
      :delta="() => 2.4"
      delta-format="points"
      :caption="(d) => `à 3 mois : ${format.ratio(d.completion3)}`"
    />
    <NutDashboardStat
      size="1"
      :source="candidates.summary"
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
      :source="candidates.summary"
      label="Succès global"
      :value="(d) => d.success"
      format="ratio"
      :delta="() => 1.1"
      delta-format="points"
      :caption="(d) => `niveau > A1 : ${format.ratio(d.aboveA1)}`"
    />
    <NutDashboardStat
      size="1"
      :source="candidates.summary"
      label="Passages sur site"
      :value="(d) => d.onsite"
      format="integer"
      :caption="(d) => `${format.ratio(d.onsiteShare)} des passages`"
    />
    <NutDashboardStat
      size="1"
      :source="candidates.summary"
      label="Passages en ligne"
      :value="(d) => d.online"
      format="integer"
      :caption="(d) => `${format.ratio(d.onlineShare)} des passages`"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels">
    <NutDashboardLineChart
      size="12 md:6 xl:8"
      :source="candidates.registrations"
      title="Inscriptions mensuelles"
      :subtitle="`dossiers créés · ${year}${year > 2024 ? ` · pointillés ${previousYear}` : ''}`"
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
      format="integer"
      area
      totals
    />
    <NutDashboardFunnel
      size="12 md:6 xl:4"
      :source="candidates.funnel"
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
      :source="candidates.perAccount"
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
      :source="candidates.proctoring"
      title="Répartition de la surveillance"
      subtitle="passages sur la période"
      layout="stacked"
      :label="(row) => row.label"
      :value="(row) => row.count"
      :text="(row) => format.integer(row.count)"
      :color="(_, index) => DONUT_COLORS[index % DONUT_COLORS.length]"
      :center="(rows) => format.integer(sum(rows.map((row) => row.count)))"
      center-label="passages"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels">
    <NutDashboardBarChart
      :source="candidates.performance"
      title="Taux de performance par compte"
      subtitle="dix premiers comptes · objectif 80 %"
      :x="(row) => row.name"
      :x-format="shortLabel"
      :series="[
        {
          color: 'series-1',
          key: 'completion',
          label: 'Complétion',
          value: (row) => row.completion,
        },
        {
          color: 'series-4',
          key: 'completion3',
          label: 'Complétion 3 mois',
          value: (row) => row.completion3,
        },
        { color: 'series-2', key: 'success', label: 'Succès global', value: (row) => row.success },
        { color: 'series-3', key: 'aboveA1', label: 'Niveau > A1', value: (row) => row.aboveA1 },
      ]"
      :y-axis="{ format: 'percent', max: 100, ticks: 5 }"
      :reference="{ label: 'Objectif 80 %', position: 'start', value: 80 }"
      :height="300"
      :points="10"
    />
  </NutDashboardGrid>

  <NutDashboardGrid variant="panels">
    <NutDashboardStackBar
      size="12 md:6 xl:4"
      :source="candidates.edof"
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
      :source="candidates.cefr"
      title="Niveaux CECRL obtenus"
      subtitle="part des examens réussis"
      :x="(row) => row.level"
      :series="[{ color: 'series-1', key: 'share', label: 'Part', value: (row) => row.share }]"
      :y-axis="{ format: 'percent', max: 40 }"
      :height="190"
      :legend="false"
      :points="6"
    />
    <NutDashboardBars
      size="12 md:12 xl:4"
      :source="candidates.delay"
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
</template>

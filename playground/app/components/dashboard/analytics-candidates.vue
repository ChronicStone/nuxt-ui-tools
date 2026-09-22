<script setup lang="ts">
import { useDashboardFormat, useDashboardView } from '#ui-tools/dashboard'

import { candidatesView } from '../../lib/dashboards/analytics/candidates'
import { monthLabel } from '../../lib/demo-dashboard-api'

const candidates = useDashboardView(candidatesView)
const format = useDashboardFormat()

const year = computed(() => candidates.params.year)
const previousYear = computed(() => String(candidates.params.year - 1))
const month = (row: { month: number }) => monthLabel(row.month)
</script>

<template>
  <NutDashboardGrid>
    <NutDashboardGrid columns="1 sm:2 lg:3 xl:6">
      <NutDashboardStat
        size="1"
        :source="candidates.summary"
        label="Registered"
        :value="(d) => d.registered"
        format="integer"
        :caption="(d) => `${format.integer(d.delivered)} certificates delivered`"
      />
      <NutDashboardStat
        size="1"
        :source="candidates.summary"
        label="Completion rate"
        :value="(d) => d.completion"
        format="ratio"
        :delta="() => 2.4"
        delta-format="points"
        :caption="(d) => `at 3 months: ${format.ratio(d.completion3)}`"
      />
      <NutDashboardStat
        size="1"
        :source="candidates.summary"
        label="Compromised rate"
        :value="(d) => d.compromised"
        format="ratio"
        :delta="() => -0.8"
        delta-format="points"
        invert-delta
        caption="sessions invalidated by proctoring"
      />
      <NutDashboardStat
        size="1"
        :source="candidates.summary"
        label="Overall success"
        :value="(d) => d.success"
        format="ratio"
        :delta="() => 1.1"
        delta-format="points"
        :caption="(d) => `level above A1: ${format.ratio(d.aboveA1)}`"
      />
      <NutDashboardStat
        size="1"
        :source="candidates.summary"
        label="On-site sessions"
        :value="(d) => d.onsite"
        format="integer"
        :caption="(d) => `${format.ratio(d.onsite / (d.onsite + d.online))} of sessions`"
      />
      <NutDashboardStat
        size="1"
        :source="candidates.summary"
        label="Online sessions"
        :value="(d) => d.online"
        format="integer"
        :caption="(d) => `${format.ratio(d.online / (d.onsite + d.online))} of sessions`"
      />
    </NutDashboardGrid>

    <NutDashboardLineChart
      size="12 xl:8"
      :source="candidates.registrations"
      title="Monthly registrations"
      :subtitle="`files created · ${year}`"
      :x="month"
      area
      :series="[{ key: 'current', label: String(year), value: (row) => row.current }]"
      :comparison="{ key: 'previous', label: previousYear, value: (row) => row.previous }"
      format="integer"
      totals
    />

    <NutDashboardFunnel
      size="12 md:6 xl:4"
      :source="candidates.funnel"
      title="Certification journey"
      subtitle="from registration to certificate"
      :label="(row) => row.label"
      :value="(row) => row.count"
      format="integer"
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
      format="integer"
      :limit="15"
    />

    <NutDashboardDonutChart
      size="12 md:6 xl:4"
      :source="candidates.proctoring"
      title="Proctoring split"
      subtitle="sessions over the period"
      :label="(row) => row.label"
      :value="(row) => row.count"
      :text="(row) => format.integer(row.count)"
      :center="(rows) => rows.reduce((total, row) => total + row.count, 0)"
      center-label="sessions"
    />

    <NutDashboardBarChart
      :source="candidates.performance"
      title="Performance per account"
      subtitle="first ten accounts · target 80 %"
      :x="(row) => row.name"
      :x-format="
        (value) => (String(value).length > 14 ? `${String(value).slice(0, 13)}…` : String(value))
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
      :y-axis="{ format: 'percent', max: 100 }"
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
      :y-axis="{ format: 'percent', max: 40 }"
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
      :meta="(row) => format.percent(row.share)"
    >
      <template #footer>
        <NutDashboardTotal label="Median delay" value="9 days" />
      </template>
    </NutDashboardBars>
  </NutDashboardGrid>
</template>

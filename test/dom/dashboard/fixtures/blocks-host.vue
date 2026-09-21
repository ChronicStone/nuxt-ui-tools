<script setup lang="ts">
import { ref } from 'vue'

import type {
  DashboardMenuContext,
  DashboardSelectEvent,
  DashboardTableSort,
} from '#ui-tools/dashboard'
import DashboardAlerts from '#ui-tools/dashboard/components/dashboard-alerts.vue'
import DashboardBarChart from '#ui-tools/dashboard/components/dashboard-bar-chart.vue'
import DashboardFeed from '#ui-tools/dashboard/components/dashboard-feed.vue'
import DashboardFunnel from '#ui-tools/dashboard/components/dashboard-funnel.vue'
import DashboardGauge from '#ui-tools/dashboard/components/dashboard-gauge.vue'
import DashboardGrid from '#ui-tools/dashboard/components/dashboard-grid.vue'
import DashboardList from '#ui-tools/dashboard/components/dashboard-list.vue'
import DashboardRefresh from '#ui-tools/dashboard/components/dashboard-refresh.vue'
import DashboardStat from '#ui-tools/dashboard/components/dashboard-stat.vue'
import DashboardStats from '#ui-tools/dashboard/components/dashboard-stats.vue'
import DashboardTable from '#ui-tools/dashboard/components/dashboard-table.vue'
import DashboardTabs from '#ui-tools/dashboard/components/dashboard-tabs.vue'
import DashboardWidget from '#ui-tools/dashboard/components/dashboard-widget.vue'

import type { Account, BlockScenario, BlocksDashboard } from './blocks-schema'

const props = defineProps<{
  dashboard: BlocksDashboard
  scenario: BlockScenario
  /** Collects `select` payloads for assertions. */
  selections?: DashboardSelectEvent<Account>[]
  /** Collects action names (header / footer buttons, menu and row actions). */
  events?: string[]
  /** Collects the context a function `menu` receives. */
  contexts?: DashboardMenuContext[]
}>()

const sort = ref<DashboardTableSort | null | undefined>({ direction: 'desc', key: 'units' })
const tab = ref<'company' | 'school'>('company')
const picked = ref<string>('Globex')

function record(event: DashboardSelectEvent<Account>) {
  props.selections?.push(event)
}
function log(name: string) {
  props.events?.push(name)
}
function contextMenu(context: DashboardMenuContext) {
  props.contexts?.push(context)
  return ['csv' as const, { label: 'Copy rows', onSelect: () => log(`copy:${context.title}`) }]
}
</script>

<template>
  <DashboardGrid v-if="scenario === 'stat'" columns="4">
    <DashboardStat
      size="2"
      :source="dashboard.summary"
      label="Revenue"
      :value="(data) => data.revenue"
      :format="(value) => `${value} €`"
      :delta="(data) => ((data.revenue - data.previous) / data.previous) * 100"
      :caption="(data) => `vs ${data.previous}`"
    />
  </DashboardGrid>

  <DashboardList
    v-else-if="scenario === 'list'"
    :source="dashboard.accounts"
    title="Top accounts"
    leading="avatar"
    :label="(row) => row.name"
    :description="(row) => row.kind"
    :delta="(row) => row.change"
    :value="(row) => row.units"
  />

  <DashboardList
    v-else-if="scenario === 'empty-list'"
    :source="dashboard.accounts"
    :empty="{ title: 'No account yet' }"
    :label="(row) => row.name"
  />

  <DashboardWidget v-else-if="scenario === 'widget'" :source="dashboard.growth" title="Growth">
    <template #default="{ data }">
      <output>{{ `${data.toFixed(1)}%` }}</output>
    </template>
  </DashboardWidget>

  <DashboardFunnel
    v-else-if="scenario === 'funnel'"
    :source="dashboard.steps"
    activation="mount"
    :label="(step) => step.label"
    :value="(step) => step.count"
  />

  <template v-else-if="scenario === 'panels'">
    <DashboardGrid variant="panels" columns="2">
      <DashboardStat
        size="1"
        :source="dashboard.summary"
        label="In a panel"
        :value="(data) => data.revenue"
      />
    </DashboardGrid>
    <DashboardGrid>
      <DashboardStat
        :source="dashboard.summary"
        label="Standalone"
        :value="(data) => data.revenue"
      />
    </DashboardGrid>
  </template>

  <DashboardList
    v-else-if="scenario === 'toolbar'"
    :source="dashboard.accounts"
    title="Accounts"
    :label="(row) => row.name"
  >
    <template #toolbar>
      <span data-test="chip">Active filter</span>
    </template>
    <template #footer>
      <span data-test="total">Total</span>
    </template>
  </DashboardList>

  <DashboardBarChart
    v-else-if="scenario === 'bar-chart'"
    :source="dashboard.months"
    title="Consumption"
    :x="(row) => row.month"
    :series="[
      { key: 'used', label: 'Used', value: (row) => row.used },
      { key: 'billed', label: 'Billed', value: (row) => row.billed },
    ]"
    :comparison="{ key: 'previous', label: '2025', value: (row) => row.billed / 2 }"
  />

  <DashboardList
    v-else-if="scenario === 'menu'"
    :source="dashboard.accounts"
    title="Top accounts"
    menu
    freshness
    :limit="1"
    :label="(row) => row.name"
    :value="(row) => row.units"
    :delta="(row) => row.change"
  />

  <DashboardGrid v-else-if="scenario === 'grid-menu'" :menu="['csv']">
    <DashboardStat :source="dashboard.summary" label="Revenue" :value="(data) => data.revenue" />
    <DashboardList :source="dashboard.accounts" title="Accounts" :label="(row) => row.name" />
    <DashboardList
      :source="dashboard.accounts"
      title="Opted out"
      :menu="false"
      :label="(row) => row.name"
    />
  </DashboardGrid>

  <DashboardList
    v-else-if="scenario === 'select'"
    :source="dashboard.accounts"
    :label="(row) => row.name"
    @select="record"
  />

  <DashboardAlerts
    v-else-if="scenario === 'alerts'"
    :source="dashboard.alerts"
    title="Needs attention"
    :severity="(alert) => alert.level"
    :label="(alert) => alert.title"
    :value="(alert) => alert.count"
    :action="(alert) => (alert.level === 'error' ? { label: 'Review', to: '/review' } : null)"
  />

  <DashboardFeed
    v-else-if="scenario === 'feed'"
    :source="dashboard.activity"
    title="Activity"
    group-by="day"
    :label="(event) => event.text"
    :time="(event) => event.at"
    :icon="() => 'i-lucide-award'"
  />

  <DashboardTable
    v-else-if="scenario === 'table'"
    v-model:sort="sort"
    :source="dashboard.accounts"
    title="Accounts"
    :limit="2"
    :columns="[
      { key: 'name', label: 'Account', value: (row) => row.name },
      { key: 'units', label: 'Units', type: 'bar', value: (row) => row.units },
      { key: 'change', label: 'Change', type: 'delta', value: (row) => row.change },
    ]"
    @select="record"
  >
    <template #cell-name="{ row, value }">
      <em :data-kind="row.kind">{{ value }}</em>
    </template>
  </DashboardTable>

  <DashboardStat
    v-else-if="scenario === 'stat-variants'"
    :source="dashboard.summary"
    label="Revenue"
    :value="(data) => data.revenue"
    :trend="(data) => [data.previous, null, data.previous * 1.1, data.revenue]"
    :goal="() => 200"
    :status="(data) => (data.revenue < 200 ? { color: 'warning', label: 'Below goal' } : null)"
  />

  <DashboardList
    v-else-if="scenario === 'actions'"
    :source="dashboard.accounts"
    title="Accounts"
    :menu="contextMenu"
    :actions="[
      { label: 'Add', icon: 'i-lucide-plus', onClick: () => log('add') },
      { label: 'View all', placement: 'footer', to: '/accounts' },
    ]"
    :label="(row) => row.name"
    :value="(row) => row.units"
  />

  <template v-else-if="scenario === 'row-actions'">
    <DashboardList
      :source="dashboard.accounts"
      title="Accounts"
      :label="(row) => row.name"
      :selected="(row) => row.name === picked"
      :row-actions="
        (row) => [
          {
            label: 'Open',
            icon: 'i-lucide-eye',
            inline: true,
            onSelect: () => log(`open:${row.name}`),
          },
          { label: 'Archive', onSelect: () => log(`archive:${row.name}`) },
        ]
      "
      @select="({ row }) => (picked = row.name)"
    />
    <DashboardTable
      :source="dashboard.accounts"
      title="Table"
      :columns="[{ key: 'name', label: 'Account', value: (row) => row.name }]"
      :selected="(row) => row.name === picked"
      :row-actions="(row) => (row.kind === 'School' ? [] : [{ label: 'Edit' }])"
    />
  </template>

  <DashboardBarChart
    v-else-if="scenario === 'chart-emphasis'"
    :source="dashboard.months"
    title="Consumption"
    :x="(row) => row.month"
    :series="[
      {
        key: 'used',
        label: 'Used',
        value: (row) => row.used,
        compare: (row) => row.billed,
      },
    ]"
    highlight="max"
    labels
    :selected="(row) => row.month === 'Mar'"
  />

  <DashboardStats
    v-else-if="scenario === 'stats'"
    :source="dashboard.summary"
    title="Breakdown"
    variant="tiles"
    :items="[
      {
        key: 'revenue',
        label: 'Revenue',
        value: (data) => data.revenue,
        delta: (data) => ((data.revenue - data.previous) / data.previous) * 100,
        icon: 'i-lucide-euro',
        progress: (data) => (data.revenue / 200) * 100,
      },
      {
        key: 'previous',
        label: 'Previous',
        value: (data) => data.previous,
        caption: 'last month',
        status: () => ({ color: 'success', label: 'Good' }),
      },
    ]"
  />

  <DashboardGauge
    v-else-if="scenario === 'gauge'"
    :source="dashboard.summary"
    title="Goal"
    :value="(data) => data.revenue"
    :max="(data) => data.previous * 2"
    :target="() => 150"
    caption="Revenue"
  />

  <div v-else-if="scenario === 'tabs'">
    <DashboardTabs
      v-model="tab"
      :items="[
        { value: 'company', label: 'Companies' },
        { value: 'school', label: 'Schools', count: 2 },
      ]"
    />
    <output>{{ tab }}</output>
  </div>

  <DashboardStat
    v-else-if="scenario === 'stat-compare'"
    :source="dashboard.summary"
    label="Revenue"
    :value="(data) => data.revenue"
    :compare="(data) => data.previous"
    :trend="(data) => [data.previous, data.revenue]"
    trend-type="bars"
  />

  <DashboardRefresh v-else-if="scenario === 'refresh'" :dashboard :intervals="[0, 30, 300]" />
</template>

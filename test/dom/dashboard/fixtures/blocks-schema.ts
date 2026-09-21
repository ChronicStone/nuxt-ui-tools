import { defineDashboardSchema } from '#ui-tools/dashboard'
import type { DashboardApi } from '#ui-tools/dashboard'

import { deferredSource } from '../harness'

export interface Summary {
  revenue: number
  previous: number
}
export interface Account {
  name: string
  kind: string
  units: number
  change: number
}
export interface Month {
  month: string
  used: number
  billed: number
}
export interface Step {
  label: string
  count: number
}
export interface Alert {
  level: 'error' | 'warning' | 'info' | 'success'
  title: string
  count: number
}
export interface Activity {
  text: string
  at: number
}

export function createBlockSources() {
  return {
    accounts: deferredSource<Account[]>(),
    activity: deferredSource<Activity[]>(),
    alerts: deferredSource<Alert[]>(),
    months: deferredSource<Month[]>(),
    steps: deferredSource<Step[]>(),
    summary: deferredSource<Summary>(),
  }
}

export type BlockSources = ReturnType<typeof createBlockSources>

export function createBlocksSchema(sources: BlockSources) {
  return defineDashboardSchema({
    key: 'blocks',
    queries: ({ deferred, essential }) => ({
      accounts: essential.query({
        defaultValue: [],
        query: () => ({ queryFn: sources.accounts.fn, queryKey: ['accounts'] }),
      }),
      activity: essential.query({
        defaultValue: [],
        query: () => ({ queryFn: sources.activity.fn, queryKey: ['activity'] }),
      }),
      alerts: essential.query({
        defaultValue: [],
        query: () => ({ queryFn: sources.alerts.fn, queryKey: ['alerts'] }),
      }),
      months: essential.query({
        defaultValue: [],
        query: () => ({ queryFn: sources.months.fn, queryKey: ['months'] }),
      }),
      steps: deferred.query({
        defaultValue: [],
        query: () => ({ queryFn: sources.steps.fn, queryKey: ['steps'] }),
      }),
      summary: essential.query(() => ({ queryFn: sources.summary.fn, queryKey: ['summary'] })),
    }),
    derive: ({ data }) => ({
      growth: () =>
        data.summary
          ? ((data.summary.revenue - data.summary.previous) / data.summary.previous) * 100
          : 0,
    }),
  })
}

export type BlocksDashboard = DashboardApi<ReturnType<typeof createBlocksSchema>>

export type BlockScenario =
  | 'stat'
  | 'list'
  | 'empty-list'
  | 'widget'
  | 'funnel'
  | 'bar-chart'
  | 'panels'
  | 'toolbar'
  | 'menu'
  | 'grid-menu'
  | 'select'
  | 'alerts'
  | 'feed'
  | 'table'
  | 'stat-variants'
  | 'actions'
  | 'row-actions'
  | 'chart-emphasis'
  | 'stats'
  | 'gauge'
  | 'tabs'
  | 'stat-compare'
  | 'refresh'

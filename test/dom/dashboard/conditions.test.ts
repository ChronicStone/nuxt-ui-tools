import { describe, expect, it } from 'vitest'
import { h, ref } from 'vue'

import {
  defineDashboardFilters,
  defineDashboardSchema,
  defineDashboardView,
} from '#ui-tools/dashboard'
import DashboardFilters from '#ui-tools/dashboard/components/dashboard-filters.vue'
import DashboardGrid from '#ui-tools/dashboard/components/dashboard-grid.vue'
import DashboardStat from '#ui-tools/dashboard/components/dashboard-stat.vue'

import { deferredSource, mountDashboard } from './harness'

type Workspace = 'ADMIN' | 'CLIENT' | 'MANAGER'

/**
 * One dashboard served to three workspaces: the workspace is a headless param synced from the
 * session, and every condition reads it.
 */
function createWorkspaceSchema(initial: Workspace) {
  const workspace = ref<Workspace>(initial)
  const summary = deferredSource<{ units: number }>()
  const margin = deferredSource<{ rate: number }>()
  const cohort = deferredSource<{ registered: number }>()
  const context = defineDashboardFilters({
    workspace: (p) =>
      p.enum(['ADMIN', 'CLIENT', 'MANAGER'], {
        defaultValue: 'ADMIN',
        headless: true,
        sync: workspace,
      }),
  })
  const consumption = defineDashboardView({
    label: 'Consumption',
    shared: context,
    params: (p, { params }) => ({
      account: p.string({ enabled: () => params.workspace !== 'CLIENT', label: 'Account' }),
    }),
    queries: ({ essential, params }) => ({
      summary: essential.query(() => ({
        queryFn: () => summary.fn(params.account),
        queryKey: ['summary', params.account],
      })),
      margin: essential.query({
        enabled: () => params.workspace === 'ADMIN',
        query: () => ({ queryFn: () => margin.fn(), queryKey: ['margin'] }),
      }),
    }),
    derive: ({ data }) => ({ marginRate: () => data.margin?.rate ?? null }),
  })
  const certifications = defineDashboardView({
    label: 'Certifications',
    shared: context,
    enabled: ({ params }) => params.workspace !== 'MANAGER',
    queries: ({ essential }) => ({
      overview: essential.query(() => ({ queryFn: () => cohort.fn(), queryKey: ['cohort'] })),
    }),
  })
  const schema = defineDashboardSchema({
    key: 'workspaces',
    params: context,
    views: { consumption, certifications },
  })
  return { cohort, margin, schema, summary, workspace }
}

describe('dashboard conditions', () => {
  it('disables queries whose condition does not hold, with the values derived from them', async () => {
    const { margin, schema, summary, workspace } = createWorkspaceSchema('CLIENT')
    const { dashboard, flush } = await mountDashboard({ schema })
    const view = dashboard.consumption

    expect(view.margin.state).toBe('disabled')
    expect(view.marginRate.state).toBe('disabled')
    expect(margin.calls).toHaveLength(0)

    // Nothing waits for a disabled query.
    summary.calls[0]?.resolve({ units: 4 })
    await flush()
    expect(view.state).toBe('ready')
    expect(dashboard.state).toBe('ready')

    workspace.value = 'ADMIN'
    await flush()
    expect(view.margin.state).toBe('loading')
    margin.calls[0]?.resolve({ rate: 0.4 })
    await flush()
    expect(view.marginRate.data).toBe(0.4)
  })

  it('leaves disabled views out of the tabs and falls back from a URL naming one', async () => {
    const { cohort, schema, workspace } = createWorkspaceSchema('MANAGER')
    const { dashboard, flush } = await mountDashboard({ query: { view: 'certifications' }, schema })

    expect(dashboard.view.current).toBe('consumption')
    expect(dashboard.view.items.map((item) => item.value)).toEqual(['consumption'])
    expect(dashboard.certifications.view.enabled).toBe(false)
    expect(dashboard.certifications.overview.state).toBe('disabled')

    dashboard.view.current = 'certifications'
    await flush()
    expect(dashboard.view.current).toBe('consumption')
    expect(cohort.calls).toHaveLength(0)

    // Once enabled, the view the URL names is on screen again, and fetches.
    workspace.value = 'CLIENT'
    await flush()
    expect(dashboard.view.current).toBe('certifications')
    expect(cohort.calls).toHaveLength(1)
  })

  it('keeps disabled params out of the bar and out of queries', async () => {
    const { schema, summary, workspace } = createWorkspaceSchema('CLIENT')
    const { dashboard, flush, wrapper } = await mountDashboard({
      query: { 'consumption.account': 'acme' },
      render: (dashboard) => h(DashboardFilters, { dashboard }),
      schema,
    })
    const view = dashboard.consumption

    expect(view.params.account).toBeUndefined()
    expect(view.filters.account.enabled).toBe(false)
    expect(view.filtered).toBe(false)
    expect(summary.calls.map((call) => call.args)).toEqual([[undefined]])
    expect(wrapper.find('[data-dashboard-filter="account"]').exists()).toBe(false)

    view.params.account = 'globex'
    await flush()
    expect(view.params.account).toBeUndefined()

    workspace.value = 'ADMIN'
    await flush()
    expect(view.params.account).toBe('acme')
    expect(summary.calls.at(-1)?.args).toEqual(['acme'])
    expect(wrapper.find('[data-dashboard-filter="account"]').exists()).toBe(true)
  })

  it('renders nothing for blocks bound to disabled sources, and collapses emptied grids', async () => {
    const { schema, workspace } = createWorkspaceSchema('CLIENT')
    const { flush, wrapper } = await mountDashboard({
      render: (dashboard) => [
        h(DashboardGrid, { 'data-grid': 'row', variant: 'panels' }, () => [
          h(DashboardStat, {
            label: 'Units',
            size: '8',
            source: dashboard.consumption.summary,
            value: () => 0,
          }),
          h(DashboardStat, {
            label: 'Margin',
            size: '4',
            source: dashboard.consumption.margin,
            value: () => 0,
          }),
        ]),
        h(DashboardGrid, { 'data-grid': 'margin', variant: 'panels' }, () => [
          h(DashboardStat, {
            label: 'Margin',
            source: dashboard.consumption.marginRate,
            value: () => 0,
          }),
        ]),
      ],
      schema,
    })
    const cells = (grid: string) => wrapper.findAll(`[data-grid="${grid}"] > section`)

    // The remaining cell keeps its span as its growth share, so its row closes up.
    expect(cells('row')).toHaveLength(1)
    expect(cells('row')[0]?.attributes('style')).toContain('flex-grow: 8')
    expect(cells('margin')).toHaveLength(0)
    expect(wrapper.find('[data-grid="margin"]').classes()).toContain('empty:hidden')

    workspace.value = 'ADMIN'
    await flush()
    expect(cells('row')).toHaveLength(2)
    expect(cells('margin')).toHaveLength(1)
  })
})

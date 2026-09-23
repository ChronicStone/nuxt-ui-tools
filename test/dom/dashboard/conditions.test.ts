import { describe, expect, it } from 'vitest'
import { h, ref } from 'vue'
import type { Ref } from 'vue'

import { defineDashboardSchema, defineDashboardView } from '#ui-tools/dashboard'
import DashboardFilters from '#ui-tools/dashboard/components/dashboard-filters.vue'
import DashboardGrid from '#ui-tools/dashboard/components/dashboard-grid.vue'
import DashboardStat from '#ui-tools/dashboard/components/dashboard-stat.vue'
import DashboardViewTabs from '#ui-tools/dashboard/components/dashboard-view-tabs.vue'

import { deferredSource, mountDashboard } from './harness'

type Workspace = 'ADMIN' | 'CLIENT' | 'MANAGER'

/** One dashboard served to three workspaces: every condition reads the workspace it is given. */
interface WorkspaceParams {
  workspace: Ref<Workspace>
  summary: ReturnType<typeof deferredSource<{ units: number }>>
  margin: ReturnType<typeof deferredSource<{ rate: number }>>
  cohort: ReturnType<typeof deferredSource<{ registered: number }>>
}

function consumptionView(params: WorkspaceParams) {
  return defineDashboardView({
    label: 'Consumption',
    filters: (f) => ({
      account: f.string({ enabled: () => params.workspace.value !== 'CLIENT', label: 'Account' }),
    }),
    queries: ({ essential, filters }) => ({
      summary: essential.query(() => ({
        queryFn: () => params.summary.fn(filters.account),
        queryKey: ['summary', filters.account],
      })),
      margin: essential.query({
        enabled: () => params.workspace.value === 'ADMIN',
        query: () => ({ queryFn: () => params.margin.fn(), queryKey: ['margin'] }),
      }),
    }),
    derive: ({ data }) => ({ marginRate: () => data.margin?.rate ?? null }),
  })
}

function certificationsView(params: WorkspaceParams) {
  return defineDashboardView({
    label: 'Certifications',
    enabled: () => params.workspace.value !== 'MANAGER',
    queries: ({ essential }) => ({
      overview: essential.query(() => ({
        queryFn: () => params.cohort.fn(),
        queryKey: ['cohort'],
      })),
    }),
  })
}

function workspaceSchema(params: WorkspaceParams) {
  return defineDashboardSchema({
    key: 'workspaces',
    views: { consumption: consumptionView(params), certifications: certificationsView(params) },
  })
}

function createWorkspaceSchema(initial: Workspace) {
  const params: WorkspaceParams = {
    cohort: deferredSource<{ registered: number }>(),
    margin: deferredSource<{ rate: number }>(),
    summary: deferredSource<{ units: number }>(),
    workspace: ref<Workspace>(initial),
  }
  return { ...params, schema: workspaceSchema(params) }
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

  it('renders no tab strip while a single view is enabled', async () => {
    const { schema, workspace } = createWorkspaceSchema('MANAGER')
    const { flush, wrapper } = await mountDashboard({
      render: (dashboard) => h(DashboardViewTabs, { dashboard }),
      schema,
    })

    expect(wrapper.find('[data-dashboard-view-tabs]').exists()).toBe(false)

    workspace.value = 'CLIENT'
    await flush()
    const tabs = wrapper.findAll('[data-dashboard-view-tabs] button')
    expect(tabs.map((tab) => tab.text())).toEqual(['Consumption', 'Certifications'])
  })

  it('keeps disabled filters out of the bar and out of queries', async () => {
    const { schema, summary, workspace } = createWorkspaceSchema('CLIENT')
    const { dashboard, flush, wrapper } = await mountDashboard({
      query: { account: 'acme' },
      render: (api) => h(DashboardFilters, { dashboard: api }),
      schema,
    })
    const view = dashboard.consumption

    expect(view.filters.account).toBeUndefined()
    expect(view.controls.account.enabled).toBe(false)
    expect(view.filtered).toBe(false)
    expect(summary.calls.map((call) => call.args)).toEqual([[undefined]])
    expect(wrapper.find('[data-dashboard-filter="account"]').exists()).toBe(false)

    view.filters.account = 'globex'
    await flush()
    expect(view.filters.account).toBeUndefined()

    workspace.value = 'ADMIN'
    await flush()
    expect(view.filters.account).toBe('acme')
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
    // The display is a class, so `empty:hidden` is not overridden by an inline `display`.
    expect(wrapper.find('[data-grid="margin"]').classes()).toEqual(
      expect.arrayContaining(['flex', 'empty:hidden']),
    )
    expect(wrapper.find('[data-grid="margin"]').attributes('style')).not.toContain('display')

    workspace.value = 'ADMIN'
    await flush()
    expect(cells('row')).toHaveLength(2)
    expect(cells('margin')).toHaveLength(1)
  })
})

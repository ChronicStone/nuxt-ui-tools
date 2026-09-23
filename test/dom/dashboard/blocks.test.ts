import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import type { DashboardMenuContext, DashboardSelectEvent } from '#ui-tools/dashboard'

import { texts } from '../harness'
import BlocksHost from './fixtures/blocks-host.vue'
import { createBlockSources, createBlocksSchema } from './fixtures/blocks-schema'
import type { Account, BlockScenario } from './fixtures/blocks-schema'
import TemplateInference from './fixtures/template-inference.vue'
import { mountDashboard } from './harness'

async function mountScenario(scenario: BlockScenario) {
  const sources = createBlockSources()
  const selections: DashboardSelectEvent<Account>[] = []
  const events: string[] = []
  const contexts: DashboardMenuContext[] = []
  const harness = await mountDashboard({
    render: (dashboard) => h(BlocksHost, { contexts, dashboard, events, scenario, selections }),
    schema: createBlocksSchema(sources),
  })
  return { ...harness, contexts, events, selections, sources }
}

const ACCOUNTS: Account[] = [
  { change: 12.5, kind: 'Company', name: 'Acme, Inc.', units: 1200 },
  { change: -4, kind: 'School', name: 'Globex', units: 800 },
  { change: 3, kind: 'Company', name: 'Initech', units: 900 },
]

/** Units use narrow no-break spaces in French: compare with plain spaces. */
function plain(text: string) {
  return text.replace(/\s/gu, ' ')
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('dashboard blocks', () => {
  it('keeps values out of the DOM while loading, then renders the stat with its delta', async () => {
    const { flush, sources, wrapper } = await mountScenario('stat')

    const card = wrapper.find('[data-phase]')
    expect(card.attributes('data-phase')).toBe('loading')
    expect(card.attributes('aria-busy')).toBe('true')
    // A 2-column cell of a 4-column grid: it grows by its span when its row is not full.
    expect(card.attributes('style')).toContain('flex-grow: 2')
    expect(card.attributes('style')).toContain('flex-basis: calc((100% - 3 * 1rem) / 4 * 2')
    expect(wrapper.text()).toContain('Revenue')
    expect(wrapper.text()).not.toContain('€')

    sources.summary.calls[0]?.resolve({ previous: 100, revenue: 125 })
    await flush()
    expect(wrapper.find('[data-phase]').attributes('data-phase')).toBe('content')
    expect(wrapper.text()).toContain('125 €')
    expect(wrapper.text()).toContain('+25')
    expect(wrapper.text()).toContain('vs 100')
  })

  it('shows a retryable error scoped to the failing block', async () => {
    const { flush, sources, wrapper } = await mountScenario('stat')

    sources.summary.calls[0]?.reject(new Error('boom'))
    await flush()
    expect(wrapper.find('[data-state="error"]').exists()).toBe(true)

    expect(wrapper.find('[data-progress]').exists()).toBe(false)
    await wrapper.find('[data-state="error"] button').trigger('click')
    await flush()
    expect(sources.summary.calls).toHaveLength(2)
    // Never loaded: the retry starts over, with the skeleton and the progress bar.
    expect(wrapper.find('[data-phase]').attributes('data-phase')).toBe('loading')
    expect(wrapper.find('[data-progress]').exists()).toBe(true)
    sources.summary.calls[1]?.resolve({ previous: 1, revenue: 42 })
    await flush()
    expect(wrapper.find('[data-state="error"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('42')
  })

  it('shows a retry in flight when the error came after data', async () => {
    const { dashboard, flush, sources, wrapper } = await mountScenario('stat')
    sources.summary.calls[0]?.resolve({ previous: 1, revenue: 42 })
    await flush()
    void dashboard.refresh().catch(() => undefined)
    await flush()
    sources.summary.calls[1]?.reject(new Error('boom'))
    await flush()
    expect(wrapper.find('[data-state="error"]').exists()).toBe(true)

    await wrapper.find('[data-retry]').trigger('click')
    await flush()
    // TanStack keeps a query that has data in `error` while it refetches: without the bar and the
    // busy button, the click would look like it did nothing.
    expect(wrapper.find('[data-state="error"]').exists()).toBe(true)
    expect(wrapper.find('[data-progress]').exists()).toBe(true)
    expect(wrapper.find('[data-retry]').attributes('data-loading')).toBe('true')

    sources.summary.calls[2]?.resolve({ previous: 1, revenue: 43 })
    await flush()
    expect(wrapper.find('[data-progress]').exists()).toBe(false)
    expect(wrapper.text()).toContain('43')
  })

  it('renders ranked list rows', async () => {
    const { flush, sources, wrapper } = await mountScenario('list')

    sources.accounts.calls[0]?.resolve([
      { change: 12, kind: 'Company', name: 'Acme Corp', units: 1200 },
      { change: -4, kind: 'School', name: 'Globex', units: 800 },
    ])
    await flush()
    expect(texts(wrapper, 'li b')).toEqual(['Acme Corp', 'Globex'])
    expect(texts(wrapper, 'li > span:first-child')).toEqual(['AC', 'G'])
    expect(wrapper.find('li [data-trend="down"]').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/1\s200/u)
  })

  it('shows the empty state when a ready source has no rows', async () => {
    const { flush, sources, wrapper } = await mountScenario('empty-list')

    sources.accounts.calls[0]?.resolve([])
    await flush()
    expect(wrapper.find('[data-state="empty"]').text()).toContain('No account yet')
  })

  it('passes typed data to widget slots and follows derived state', async () => {
    const { flush, sources, wrapper } = await mountScenario('widget')

    expect(wrapper.find('output').exists()).toBe(false)
    sources.summary.calls[0]?.resolve({ previous: 200, revenue: 250 })
    await flush()
    expect(wrapper.find('output').text()).toBe('25.0%')
  })

  it('activates deferred sources when the block mounts', async () => {
    const { flush, sources, wrapper } = await mountScenario('funnel')

    expect(sources.steps.calls).toHaveLength(1)
    sources.steps.calls[0]?.resolve([
      { count: 200, label: 'Registered' },
      { count: 150, label: 'Passed' },
    ])
    await flush()
    expect(texts(wrapper, 'ol li b')).toEqual(['Registered', 'Passed'])
    expect(wrapper.text()).toContain('base 100 %')
    expect(wrapper.text()).toMatch(/75\s%/u)
  })

  it('draws card chrome by default and panel chrome inside a panels grid', async () => {
    const { wrapper } = await mountScenario('panels')

    const [panel, standalone] = wrapper.findAll('section[data-phase]')
    expect(wrapper.find('[data-variant="panels"]').attributes('style')).toContain('gap: 1px')
    expect(panel?.attributes('data-panel')).toBe('true')
    expect(panel?.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-0', 'px-6']))
    // Blocks forward `card`; an absent boolean prop must not turn the chrome off.
    expect(standalone?.attributes('data-panel')).toBeUndefined()
    expect(standalone?.classes()).toEqual(
      expect.arrayContaining(['rounded-lg', 'border', 'bg-default', 'px-6']),
    )
  })

  it('keeps the toolbar visible and reserves the footer while loading', async () => {
    const { flush, sources, wrapper } = await mountScenario('toolbar')

    expect(wrapper.find('[data-test="chip"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="total"]').exists()).toBe(false)
    expect(wrapper.find('footer[aria-hidden="true"] .nut-dash-ghost').exists()).toBe(true)

    sources.accounts.calls[0]?.resolve([{ change: 1, kind: 'Company', name: 'Acme', units: 3 }])
    await flush()
    expect(wrapper.find('[data-test="chip"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="total"]').exists()).toBe(true)
    expect(wrapper.find('footer[aria-hidden="true"]').exists()).toBe(false)
  })

  it('mounts blocks whose accessors are typed from their source', async () => {
    const sources = createBlockSources()
    const { wrapper } = await mountDashboard({
      render: (dashboard) => h(TemplateInference, { dashboard }),
      schema: createBlocksSchema(sources),
    })
    expect(wrapper.findAll('[data-phase="loading"]')).toHaveLength(3)
  })

  it('renders chart legends and hands the frame to the renderer', async () => {
    const { flush, sources, until, wrapper } = await mountScenario('bar-chart')

    expect(wrapper.find('[data-phase="loading"]').exists()).toBe(true)
    sources.months.calls[0]?.resolve([
      { billed: 90, month: 'Jan', used: 100 },
      { billed: 110, month: 'Feb', used: 120 },
    ])
    await flush()
    expect(texts(wrapper, 'header li')).toEqual(['Used', 'Billed', '2025'])
    await until(() => wrapper.find('[data-unovis]').exists())
  })

  it('offers the table view, CSV export, and expand dialog from the card menu', async () => {
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      if (blob instanceof Blob) blobs.push(blob)
      return 'blob:dashboard'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const { flush, sources, wrapper } = await mountScenario('menu')
    const item = (label: string) =>
      wrapper.findAll('[data-ui-item]').find((entry) => entry.text() === label)

    expect(wrapper.find('[data-dashboard-menu]').exists()).toBe(true)
    expect(texts(wrapper, '[data-ui-item]')).toEqual([
      'Afficher en tableau',
      'Télécharger en CSV',
      'Agrandir',
    ])
    expect(item('Télécharger en CSV')?.attributes('disabled')).toBeDefined()

    sources.accounts.calls[0]?.resolve(ACCOUNTS)
    await flush()
    expect(texts(wrapper, 'section > div li b')).toEqual(['Acme, Inc.'])
    expect(wrapper.find('section > p time').text()).toBe('Mis à jour maintenant')

    await item('Agrandir')?.trigger('click')
    await flush()
    expect(texts(wrapper, '[data-ui="UModal"] li b')).toEqual(['Acme, Inc.', 'Globex', 'Initech'])

    await item('Afficher en tableau')?.trigger('click')
    await flush()
    const view = wrapper.find('section > div [data-table-view]')
    expect(texts(view, 'thead th')).toEqual(['Libellé', 'Évolution', 'Valeur'])
    expect(texts(view, 'tbody th')).toEqual(['Acme, Inc.', 'Globex', 'Initech'])
    expect(item('Masquer le tableau')).toBeDefined()

    await item('Télécharger en CSV')?.trigger('click')
    expect(click).toHaveBeenCalledOnce()
    const csv = await blobs[0]?.text()
    // French spreadsheets: `;` between fields, `,` as the decimal mark, raw numbers.
    expect(csv?.replace(/^﻿/u, '')).toBe(
      '"Libellé";"Évolution";"Valeur"\r\n"Acme, Inc.";12,5;1200\r\n"Globex";-4;800\r\n"Initech";3;900',
    )
  })

  it('inherits the grid menu and keeps it off blocks without actions', async () => {
    const { flush, sources, wrapper } = await mountScenario('grid-menu')
    sources.summary.calls[0]?.resolve({ previous: 1, revenue: 2 })
    sources.accounts.calls[0]?.resolve(ACCOUNTS)
    await flush()

    // The stat has no table to export, and the last list opts out.
    expect(wrapper.findAll('[data-dashboard-menu]')).toHaveLength(1)
    expect(texts(wrapper, '[data-ui-item]')).toEqual(['Télécharger en CSV'])
  })

  it('emits the selected row and its index', async () => {
    const { flush, selections, sources, wrapper } = await mountScenario('select')
    sources.accounts.calls[0]?.resolve(ACCOUNTS)
    await flush()

    const buttons = wrapper.findAll('li > button')
    expect(buttons.map((button) => button.attributes('aria-label'))).toEqual([
      'Acme, Inc.',
      'Globex',
      'Initech',
    ])
    await buttons[1]?.trigger('click')
    expect(selections).toEqual([{ index: 1, row: ACCOUNTS[1] }])
  })

  it('lists alerts by severity, with their action, and says when all is clear', async () => {
    const { flush, sources, wrapper } = await mountScenario('alerts')
    sources.alerts.calls[0]?.resolve([
      { count: 3, level: 'info', title: 'New accounts' },
      { count: 12, level: 'error', title: 'Sessions to review' },
      { count: 2, level: 'warning', title: 'Quota almost reached' },
    ])
    await flush()

    expect(
      wrapper.findAll('[data-severity]').map((row) => row.attributes('data-severity')),
    ).toEqual(['error', 'warning', 'info'])
    expect(texts(wrapper, '[data-severity] b')).toEqual([
      'Sessions to review',
      'Quota almost reached',
      'New accounts',
    ])
    const action = wrapper.find('[data-severity="error"] [data-ui="UButton"]')
    expect(action.text()).toBe('Review')
    expect(action.attributes('to')).toBe('/review')
    expect(wrapper.findAll('[data-ui="UButton"]')).toHaveLength(1)
  })

  it('shows the all-clear state when there is no alert', async () => {
    const { flush, sources, wrapper } = await mountScenario('alerts')
    sources.alerts.calls[0]?.resolve([])
    await flush()
    expect(wrapper.find('[data-state="empty"]').text()).toContain('Rien à signaler')
  })

  it('groups the feed by day with relative times', async () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 21, 12, 0), toFake: ['Date'] })
    const { flush, sources, wrapper } = await mountScenario('feed')
    const now = Date.now()
    sources.activity.calls[0]?.resolve([
      { at: now - 5 * 60_000, text: 'Acme certified 12 candidates' },
      { at: now - 2 * 3_600_000, text: 'Globex opened a session' },
      { at: now - 26 * 3_600_000, text: 'Initech joined' },
    ])
    await flush()

    expect(texts(wrapper, 'section h3')).toEqual(['Aujourd’hui', 'Hier'])
    expect(texts(wrapper, 'ol li time').map((text) => text.replaceAll(/\s/gu, ' '))).toEqual([
      'il y a 5 min',
      'il y a 2 h',
      'hier',
    ])
    expect(wrapper.find('ol li time').attributes('datetime')).toBe(
      new Date(now - 5 * 60_000).toISOString(),
    )
  })

  it('sorts, limits, and selects table rows', async () => {
    const { flush, selections, sources, wrapper } = await mountScenario('table')
    sources.accounts.calls[0]?.resolve(ACCOUNTS)
    await flush()

    // Bound sort: units, descending. Two rows shown.
    expect(texts(wrapper, 'tbody em')).toEqual(['Acme, Inc.', 'Initech'])
    expect(wrapper.find('tbody em').attributes('data-kind')).toBe('Company')
    expect(wrapper.find('th[aria-sort="descending"]').text()).toBe('Units')
    expect(wrapper.find('tbody tr i').attributes('style')).toContain('width: 100%')
    expect(
      wrapper.findAll('tbody [data-trend]').map((cell) => cell.text().replaceAll(/\s/gu, ' ')),
    ).toEqual(['+12,5 %', '+3 %'])

    const header = (label: string) =>
      wrapper.findAll('thead button').find((button) => button.text() === label)
    await header('Units')?.trigger('click')
    await flush()
    expect(texts(wrapper, 'tbody em')).toEqual(['Globex', 'Initech'])
    await header('Units')?.trigger('click')
    await flush()
    expect(texts(wrapper, 'tbody em')).toEqual(['Acme, Inc.', 'Globex'])
    expect(wrapper.find('th[aria-sort="descending"]').exists()).toBe(false)

    await wrapper.find('tbody tr button').trigger('click')
    expect(selections).toEqual([{ index: 0, row: ACCOUNTS[0] }])
  })

  it('draws the stat trend, goal progress, and status', async () => {
    const { flush, sources, wrapper } = await mountScenario('stat-variants')
    expect(wrapper.find('.nut-dash-shimmer svg').exists()).toBe(true)

    sources.summary.calls[0]?.resolve({ previous: 100, revenue: 150 })
    await flush()
    // The `null` point splits the line in two runs.
    const line = wrapper.findAll('[data-sparkline] path')[1]?.attributes('d') ?? ''
    expect(line.match(/M/gu)).toHaveLength(2)
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('75')
    expect(wrapper.text()).toContain('Objectif 200')
    expect(wrapper.text()).toMatch(/75\s%/u)
    expect(wrapper.find('[data-status="warning"]').text()).toBe('Below goal')
  })

  it('renders header and footer actions, and hands its context to a function menu', async () => {
    const { contexts, events, flush, sources, wrapper } = await mountScenario('actions')
    const actions = wrapper.findAll('[data-dashboard-action]')
    expect(actions.map((action) => action.text())).toEqual(['Add', 'View all'])
    // Actions do not wait for the data.
    await actions[0]?.trigger('click')
    expect(events).toEqual(['add'])
    expect(actions[1]?.attributes('to')).toBe('/accounts')
    expect(texts(wrapper, '[data-ui-item]')).toEqual(['Télécharger en CSV', 'Copy rows'])
    expect(contexts[0]?.table()).toBeUndefined()

    sources.accounts.calls[0]?.resolve(ACCOUNTS)
    await flush()
    const context = contexts.at(-1)
    expect(context?.title).toBe('Accounts')
    expect(context?.table()?.rows.map((row) => row[0]?.text)).toEqual([
      'Acme, Inc.',
      'Globex',
      'Initech',
    ])
    await wrapper
      .findAll('[data-ui-item]')
      .find((item) => item.text() === 'Copy rows')
      ?.trigger('click')
    expect(events).toEqual(['add', 'copy:Accounts'])
  })

  it('marks selected rows and renders inline and menu row actions', async () => {
    const { events, flush, sources, wrapper } = await mountScenario('row-actions')
    sources.accounts.calls[0]?.resolve(ACCOUNTS)
    await flush()

    const list = wrapper.find('ul')
    expect(texts(list, 'li[data-selected] b')).toEqual(['Globex'])
    expect(list.findAll('li > button').map((button) => button.attributes('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ])
    const rows = list.findAll('li')
    await rows[0]?.find('[data-row-actions] [aria-label="Open"]').trigger('click')
    await rows[2]
      ?.findAll('[data-row-actions] [data-ui-item]')
      .find((item) => item.text() === 'Archive')
      ?.trigger('click')
    expect(events).toEqual(['open:Acme, Inc.', 'archive:Initech'])
    expect(rows[0]?.find('[data-row-actions] [aria-label]').exists()).toBe(true)

    // Selecting a row moves the selection.
    await rows[0]?.find('li > button').trigger('click')
    expect(texts(wrapper, 'ul li[data-selected] b')).toEqual(['Acme, Inc.'])
    expect(texts(wrapper, 'tbody tr[data-selected] td')[0]).toBe('Acme, Inc.')

    // A row whose builder returns nothing keeps an empty actions cell.
    const cells = wrapper.findAll('tbody tr').map((row) => row.find('[data-row-actions]').exists())
    expect(cells).toEqual([true, false, true])
    expect(wrapper.find('thead th:last-child').text()).toBe('Actions')
  })

  it('emphasizes the highlighted or selected bars, labels them, and adds comparison bars', async () => {
    const { flush, sources, until, wrapper } = await mountScenario('chart-emphasis')
    sources.months.calls[0]?.resolve([
      { billed: 10, month: 'Jan', used: 40 },
      { billed: 20, month: 'Feb', used: 90 },
      { billed: 30, month: 'Mar', used: 60 },
    ])
    await flush()
    await until(() => wrapper.find('[data-value-label]').exists())

    expect(texts(wrapper, '[data-value-label]')).toEqual(['40', '90', '60'])
    // The selection wins over `highlight="max"`: only March is strong.
    const strong = wrapper
      .findAll('[data-value-label]')
      .map((label) => label.classes().includes('font-semibold'))
    expect(strong).toEqual([false, false, true])
    expect(texts(wrapper, 'header li')).toEqual(['Used', 'Used (période précédente)'])
  })

  it('renders a stat group with deltas, progress, and badges', async () => {
    const { flush, sources, wrapper } = await mountScenario('stats')
    expect(wrapper.find('[data-phase="loading"]').exists()).toBe(true)

    sources.summary.calls[0]?.resolve({ previous: 100, revenue: 150 })
    await flush()
    const items = wrapper.findAll('[data-stats-item]')
    expect(items).toHaveLength(2)
    expect(wrapper.find('[data-variant="tiles"]').exists()).toBe(true)
    expect(items[0]?.find('[data-trend="up"]').text()).toMatch(/\+50/u)
    expect(items[0]?.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('75')
    expect(items[1]?.text()).toContain('Good')
    expect(items[1]?.text()).toContain('last month')
  })

  it('draws a gauge against its scale and target', async () => {
    const { flush, sources, wrapper } = await mountScenario('gauge')
    expect(wrapper.find('.nut-dash-shimmer').exists()).toBe(true)

    sources.summary.calls[0]?.resolve({ previous: 100, revenue: 150 })
    await flush()
    const meter = wrapper.find('[role="meter"]')
    expect(meter.attributes('aria-valuenow')).toBe('150')
    expect(meter.attributes('aria-valuemax')).toBe('200')
    expect(meter.text()).toContain('Revenue')
    expect(wrapper.find('[data-ring-target]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Objectif 150')
  })

  it('switches tabs through v-model with typed values', async () => {
    const { wrapper } = await mountScenario('tabs')
    expect(wrapper.find('output').text()).toBe('company')
    await wrapper.find('[data-ui-tab="school"]').trigger('click')
    expect(wrapper.find('output').text()).toBe('school')
  })

  it('derives the stat delta and caption from `compare`, and draws trend bars', async () => {
    const { flush, sources, wrapper } = await mountScenario('stat-compare')
    sources.summary.calls[0]?.resolve({ previous: 80, revenue: 100 })
    await flush()
    expect(wrapper.find('[data-trend="up"]').text()).toMatch(/\+25/u)
    expect(wrapper.text()).toContain('vs 80 sur la période précédente')
    const bars = wrapper.findAll('[data-sparkline="bars"] rect')
    expect(bars.map((bar) => bar.attributes('fill-opacity'))).toEqual(['0.35', '1'])
  })

  it('refreshes, and sets the auto-refresh interval from its menu', async () => {
    const { dashboard, flush, query, sources, wrapper } = await mountScenario('refresh')
    sources.summary.calls[0]?.resolve({ previous: 1, revenue: 2 })
    await flush()
    expect(texts(wrapper, '[data-ui-item]').map(plain)).toEqual(['Désactivée', '30 s', '5 min'])

    await wrapper
      .findAll('[data-ui-item]')
      .find((item) => plain(item.text()) === '30 s')
      ?.trigger('click')
    await flush()
    expect(dashboard.autoRefresh).toBe(30)
    expect(query().refresh).toBe('30')

    const calls = sources.summary.calls.length
    await wrapper.find('[data-dashboard-refresh] button').trigger('click')
    await flush()
    expect(sources.summary.calls.length).toBe(calls + 1)
  })
})

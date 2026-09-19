import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListGrid from '#ui-tools/table/components/data-list/DataListGrid.vue'
import GridRenderer from '#ui-tools/table/components/grid/GridRenderer.vue'

import { createAccountsSchema, createAuditSchema } from '../fixtures/accounts'
import { mountDataList, mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

function flowSchema(options: Parameters<typeof createAccountsSchema>[0] = {}) {
  const schema = createAccountsSchema(options)
  schema.grid!.mode = 'flow'
  return schema
}

describe('grid renderer part', () => {
  it('renders card skeletons while loading', async () => {
    harness = await mountDataList({
      query: { l: 'grid' },
      render: () => h(GridRenderer, { height: '400px' }),
      schema: flowSchema({ delay: 80 }),
      settle: false,
    })
    await harness.flush(1)
    const root = harness.wrapper.find('.nut-dl-grid')
    expect(root.attributes('data-loading')).toBe('true')
    const skeletons = harness.wrapper.findAll('.nut-dl-grid__skeleton')
    expect(skeletons).toHaveLength(6)
    expect(skeletons[2]!.attributes('style')).toContain('--nut-dl-i: 2')
    expect(harness.wrapper.find('.nut-dl-grid__flow').attributes('style')).toContain(
      'repeat(3, minmax(0, 1fr))',
    )
  })

  it('renders cards in flow mode with gap and responsive columns', async () => {
    harness = await mountLoaded({
      query: { l: 'grid' },
      render: () => h(DataListGrid, { height: '400px' }),
      schema: flowSchema(),
      ui: { grid: { gap: 12, ui: { item: 'item-x', root: 'root-x', viewport: 'vp-x' } } },
    })
    const w = harness.wrapper
    const root = w.find('.nut-dl-grid')
    expect(root.classes()).toContain('root-x')
    expect((root.element as HTMLElement).style.getPropertyValue('--nut-dl-grid-gap')).toBe('12px')
    expect(root.attributes('data-loading')).toBe('false')
    await harness.until(() => w.find('.nut-dl-grid').attributes('data-animated') === 'true')
    expect(w.find('.nut-dl-grid__viewport').classes()).toContain('vp-x')
    const flow = w.find('.nut-dl-grid__flow')
    expect(flow.attributes('style')).toContain('gap: 12px')
    expect(flow.attributes('style')).toContain('repeat(3, minmax(0, 1fr))')
    const items = w.findAll('.nut-dl-grid__item')
    expect(items).toHaveLength(12)
    expect(items[0]!.classes()).toContain('item-x')
    expect(items[0]!.attributes('style')).toContain('span 1 / span 1')
    expect(items[0]!.find('article.card').attributes('data-row')).toBe('acc-1')
    expect(items[0]!.find('article.card').text()).toBe('Compte 001')
    expect(w.find('.nut-dl-grid__canvas').exists()).toBeFalsy()
  })

  it('uses a virtualized canvas in contained mode', async () => {
    harness = await mountLoaded({
      query: { l: 'grid' },
      render: () => h(GridRenderer, { fill: true }),
      schema: createAccountsSchema(),
    })
    const w = harness.wrapper
    expect(w.find('.nut-dl-grid').classes()).toContain('h-full')
    expect(w.find('.nut-dl-grid__viewport').classes()).toContain('overflow-auto')
    expect(w.find('.nut-dl-grid__canvas').exists()).toBeTruthy()
    expect(w.find('.nut-dl-grid__flow').exists()).toBeFalsy()
    expect(harness.internals.grid.rowChunks.value).toHaveLength(4)
  })

  it('renders the shared empty state and an error card with retry', async () => {
    harness = await mountLoaded({
      query: { l: 'grid' },
      render: () => h(GridRenderer),
      schema: flowSchema({ rows: [] }),
    })
    const empty = harness.wrapper.find('.nut-dl-grid__state .nut-dl-empty')
    expect(empty.exists()).toBeTruthy()
    expect(empty.attributes('style')).toContain('min-height: 24rem')
    harness.unmount()

    harness = await mountDataList({
      query: { l: 'grid' },
      render: () => h(GridRenderer),
      schema: flowSchema({ fail: true }),
    })
    await harness.until(() => harness!.wrapper.find('.nut-dl-grid__state').exists())
    const state = harness.wrapper.find('.nut-dl-grid__state')
    expect(state.text()).toContain('Impossible de charger cette grille')
    const retry = state.find('[data-ui="UButton"]')
    expect(retry.attributes('data-icon')).toBe('i-lucide-refresh-cw')
    expect(retry.text()).toContain('Réessayer')
  })

  it('shows the loading-more footer while cursor pages stream in flow mode', async () => {
    const schema = createAuditSchema({ delay: 60, pageSize: 20, total: 45 })
    schema.grid!.mode = 'flow'
    harness = await mountLoaded({
      query: { l: 'grid' },
      render: () => h(GridRenderer, { height: '300px' }),
      schema,
    })
    expect(harness.wrapper.findAll('.nut-dl-grid__item')).toHaveLength(20)
    const pending = harness.internals.pagination.loadMore()
    await harness.until(() => harness!.wrapper.find('.nut-dl-grid__more').exists())
    expect(harness.wrapper.find('.nut-dl-grid__more').text()).toBe('Chargement…')
    await pending
    await harness.until(() => harness!.wrapper.findAll('.nut-dl-grid__item').length === 40)
    expect(harness.wrapper.find('.nut-dl-grid__more').exists()).toBeFalsy()
  })
})

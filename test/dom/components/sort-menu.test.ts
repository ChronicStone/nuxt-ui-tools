import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListSortMenu from '#ui-tools/table/components/data-list/DataListSortMenu.vue'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, texts, type Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const mountMenu = (options: Partial<Parameters<typeof mountLoaded>[0]> & { menuProps?: Record<string, unknown> } = {}) =>
  mountLoaded({ schema: createAccountsSchema(), ...options, render: () => h(DataListSortMenu, { layouts: ['table', 'grid'], ...options.menuProps }) })

describe('DataListSortMenu desktop', () => {
  it('shows the active sort in the trigger and lists sortable keys', async () => {
    harness = await mountMenu({ menuProps: { label: 'Tri' } })
    const w = harness.wrapper
    const trigger = w.find('.nut-dl-sortbtn')
    expect(trigger.attributes('data-icon')).toBe('i-lucide-arrow-down-up')
    expect(trigger.attributes('data-variant')).toBe('outline')
    expect(trigger.find('.nut-dl-sortbtn__label').text().replace(/\s+/g, '')).toBe('TriNom')
    expect(trigger.find('.nut-dl-sortbtn__label [data-ui="UIcon"]').attributes('data-name')).toBe('i-lucide-arrow-up')
    const items = w.findAll('[data-ui-item]')
    expect(items.map((item) => item.text())).toEqual(['Nom', 'Statut', 'Pays', 'Entité légale', 'EDOF', 'Contrats', 'Conso.', 'Trier A → Z', 'Trier Z → A'])
    expect(items[0]!.attributes('data-icon')).toBe('i-lucide-check')

    await items[1]!.trigger('click')
    await harness.flush()
    expect(harness.internals.tableColumns.sortingState.value).toMatchObject({ key: 'status', dir: 'asc' })
    await w.findAll('[data-ui-item]').at(-1)!.trigger('click')
    await harness.flush()
    expect(harness.internals.tableColumns.sortingState.value.dir).toBe('desc')
    expect(w.find('.nut-dl-sortbtn__label').text().replace(/\s+/g, '')).toBe('TriStatut')
    expect(w.find('.nut-dl-sortbtn__label [data-ui="UIcon"]').attributes('data-name')).toBe('i-lucide-arrow-down')
  })

  it('is hidden for layouts it does not cover and uses grid sort options in grid mode', async () => {
    harness = await mountMenu({ menuProps: { layouts: ['grid'] } })
    expect(harness.wrapper.find('.nut-dl-sortbtn').exists()).toBe(false)
    harness.internals.controls.setTableLayout('grid')
    await harness.flush()
    expect(harness.wrapper.find('.nut-dl-sortbtn').exists()).toBe(true)
    expect(texts(harness.wrapper, '[data-ui-item]')).toEqual(['Nom', 'Statut', 'Trier A → Z', 'Trier Z → A'])
  })

  it('merges trigger props and ui slots', async () => {
    harness = await mountMenu({ ui: { sortMenu: { size: 'sm', props: { trigger: { variant: 'ghost' } }, ui: { trigger: 'trig-x' } } }, menuProps: { props: { trigger: { color: 'primary' } } } })
    const trigger = harness.wrapper.find('.nut-dl-sortbtn')
    expect(trigger.attributes('data-variant')).toBe('ghost')
    expect(trigger.attributes('data-color')).toBe('primary')
    expect(trigger.attributes('data-size')).toBe('sm')
    expect(trigger.classes()).toContain('trig-x')
  })
})

describe('DataListSortMenu mobile sheet', () => {
  it('renders a square trigger and a bottom sheet with keys and order', async () => {
    harness = await mountMenu({ breakpoint: 'sm' })
    const w = harness.wrapper
    const trigger = w.find('.nut-dl-sortbtn--sheet')
    expect(trigger.attributes('data-square')).toBe('true')
    expect(trigger.attributes('data-icon')).toBe('i-lucide-arrow-down-up')
    expect(trigger.attributes('aria-label')).toBe('Trier')
    expect(w.find('[data-ui="UDrawer"]').attributes('data-open')).toBe('false')
    await trigger.trigger('click')
    await harness.flush()
    expect(texts(w, '.nut-dl-sheet__title')).toEqual(['Trier par', 'Ordre'])
    const rows = w.findAll('.nut-dl-sheet__row')
    expect(rows.map((row) => row.find('.flex-1').text())).toEqual(['Nom', 'Statut', 'Pays', 'Entité légale', 'EDOF', 'Contrats', 'Conso.'])
    expect(rows[0]!.classes()).toContain('font-semibold')
    expect(rows[0]!.find('[data-ui="UIcon"][data-name="i-lucide-arrow-up"]').exists()).toBe(true)
    await rows[2]!.trigger('click')
    await harness.flush()
    expect(harness.internals.tableColumns.sortingState.value.key).toBe('country')
    const order = w.findAll('.grid-cols-2 button')
    expect(order.map((b) => b.text().trim())).toEqual(['A → Z', 'Z → A'])
    expect(order[0]!.classes()).toContain('bg-default')
    await order[1]!.trigger('click')
    await harness.flush()
    expect(harness.internals.tableColumns.sortingState.value.dir).toBe('desc')
    expect(w.findAll('.grid-cols-2 button')[1]!.classes()).toContain('bg-default')
  })
})

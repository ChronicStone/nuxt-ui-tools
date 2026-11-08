import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListSelectionActions from '#ui-tools/table/components/data-list/data-list-selection-actions.vue'
import GridRenderer from '#ui-tools/table/components/grid/grid-renderer.vue'
import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { must } from '../../helpers/must'
import { asAccount, createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

function flowSchema(options: Parameters<typeof createAccountsSchema>[0] = {}) {
  const schema = createAccountsSchema(options)
  must(schema.grid).mode = 'flow'
  return schema
}

async function mountGrid(options: Parameters<typeof createAccountsSchema>[0] = {}) {
  harness = await mountLoaded({
    query: { l: 'grid' },
    render: () => [h(GridRenderer, { height: '400px' }), h(DataListSelectionActions)],
    schema: flowSchema(options),
  })
  await harness.until(() => must(harness).wrapper.findAll('.nut-dl-grid__item').length > 0)
  return harness
}

describe('grid card selection', () => {
  it('shows a checkbox on every card, and the select-all row, only with selection on', async () => {
    const on = await mountGrid({ rowLabel: true })
    const items = on.wrapper.findAll('.nut-dl-grid__item')
    expect(items).toHaveLength(12)
    expect(on.wrapper.findAll('.nut-dl-grid__select')).toHaveLength(12)
    expect(on.wrapper.find('.nut-dl-grid__select-all').exists()).toBeTruthy()
    on.unmount()

    const off = await mountGrid({ selection: { mode: false } })
    expect(off.wrapper.findAll('.nut-dl-grid__item')).toHaveLength(12)
    expect(off.wrapper.find('.nut-dl-grid__select').exists()).toBeFalsy()
    expect(off.wrapper.find('.nut-dl-grid__select-all').exists()).toBeFalsy()
    expect(off.wrapper.find('.nut-dl-grid__card input').exists()).toBeFalsy()
  })

  it('makes the checkbox a 44px, named, keyboard-reachable control in the card corner', async () => {
    const mounted = await mountGrid({ rowLabel: true })
    const control = must(mounted.wrapper.findAll('.nut-dl-grid__select')[0])
    expect(control.classes()).toEqual(
      expect.arrayContaining(['absolute', 'top-1', 'right-1', 'min-h-11', 'min-w-11']),
    )
    const input = control.find('input')
    expect(input.attributes('aria-label')).toBe('Sélectionner Compte 001')
    expect(input.attributes('tabindex')).not.toBe('-1')
    expect(
      must(mounted.wrapper.findAll('.nut-dl-grid__select')[1])
        .find('input')
        .attributes('aria-label'),
    ).toBe('Sélectionner Compte 002')
  })

  it('names the checkbox after the position without a `rowLabel`', async () => {
    const mounted = await mountGrid()
    expect(
      must(mounted.wrapper.findAll('.nut-dl-grid__select')[2])
        .find('input')
        .attributes('aria-label'),
    ).toBe('Sélectionner la ligne 3')
  })

  it('toggles the same selection the table edits, and raises the selection bar', async () => {
    const mounted = await mountGrid()
    const { selection } = mounted.internals
    expect(mounted.wrapper.find('.nut-dl-selbar').exists()).toBeFalsy()

    await must(mounted.wrapper.findAll('.nut-dl-grid__select .nut-dl-select')[0]).trigger('click')
    await mounted.flush()
    expect(selection.selectedKeys.value).toStrictEqual(['acc-1'])
    expect(selection.isRowSelected({ rowId: 'acc-1' })).toBe(true)
    expect(mounted.wrapper.find('.nut-dl-selbar').exists()).toBeTruthy()
    expect(mounted.wrapper.find('.nut-dl-grid__card[data-selected="true"]').exists()).toBeTruthy()

    await must(mounted.wrapper.findAll('.nut-dl-grid__select .nut-dl-select')[1]).trigger('click')
    await mounted.flush()
    expect(selection.selectedKeys.value).toStrictEqual(['acc-1', 'acc-2'])

    await must(mounted.wrapper.findAll('.nut-dl-grid__select .nut-dl-select')[0]).trigger('click')
    await mounted.flush()
    expect(selection.selectedKeys.value).toStrictEqual(['acc-2'])
  })

  it('shares the selection with the table layout', async () => {
    harness = await mountLoaded({
      query: { l: 'grid' },
      render: () => [h(GridRenderer, { height: '400px' }), h(TableRenderer, { height: '400px' })],
      schema: flowSchema(),
    })
    await harness.until(() => must(harness).wrapper.findAll('.nut-dl-grid__item').length > 0)
    await must(harness.wrapper.findAll('.nut-dl-grid__select .nut-dl-select')[3]).trigger('click')
    await harness.flush()
    const tableRow = must(harness.wrapper.find('tbody tr[data-row-id="acc-4"]'))
    expect(tableRow.find<HTMLInputElement>('td[data-col="__select"] input').element.checked).toBe(
      true,
    )
  })

  it('selects and clears every row from the grid-mode select-all', async () => {
    const mounted = await mountGrid()
    const { selection } = mounted.internals
    const selectAll = mounted.wrapper.find('.nut-dl-grid__select-all')
    expect(selectAll.find('input').attributes('aria-label')).toBe('Sélectionner toutes les lignes')

    await selectAll.find('.nut-dl-select').trigger('click')
    await mounted.flush()
    expect(selection.selectedCount.value).toBe(60)
    expect(selection.allSelected.value).toBe(true)
    expect(mounted.wrapper.find('.nut-dl-selbar').exists()).toBeTruthy()

    await selectAll.find('.nut-dl-select').trigger('click')
    await mounted.flush()
    expect(selection.selectedCount.value).toBe(0)
  })

  it('shows the select-all as mixed while only some rows are selected', async () => {
    const mounted = await mountGrid()
    await must(mounted.wrapper.findAll('.nut-dl-grid__select .nut-dl-select')[0]).trigger('click')
    await mounted.flush()
    expect(
      mounted.wrapper.find('.nut-dl-grid__select-all input').attributes('data-indeterminate'),
    ).toBe('true')
  })

  it('hands a custom card the selection, and its own checkbox to place', async () => {
    const schema = flowSchema()
    must(schema.grid).selectControl = false
    must(schema.grid).renderItem = ({ row, selection }) =>
      h('article', { class: 'custom-card', 'data-row': asAccount(row).id }, [
        selection.renderControl(),
        h('span', { class: 'custom-state' }, `${selection.enabled}:${selection.selected}`),
      ])
    harness = await mountLoaded({
      query: { l: 'grid' },
      render: () => h(GridRenderer, { height: '400px' }),
      schema,
    })
    await harness.until(() => must(harness).wrapper.findAll('.custom-card').length > 0)
    const w = harness.wrapper
    expect(w.find('.nut-dl-grid__select').exists()).toBeFalsy()
    const card = must(w.findAll('.custom-card')[0])
    expect(card.find('.custom-state').text()).toBe('true:false')

    await card.find('.nut-dl-select').trigger('click')
    await harness.flush()
    expect(harness.internals.selection.selectedKeys.value).toStrictEqual(['acc-1'])
    expect(must(w.findAll('.custom-card')[0]).find('.custom-state').text()).toBe('true:true')
  })

  it('still draws the corner checkbox around a custom card', async () => {
    const schema = flowSchema()
    must(schema.grid).renderItem = ({ row }) =>
      h('article', { class: 'custom-card' }, asAccount(row).id)
    harness = await mountLoaded({
      query: { l: 'grid' },
      render: () => h(GridRenderer, { height: '400px' }),
      schema,
    })
    await harness.until(() => must(harness).wrapper.findAll('.custom-card').length > 0)
    const item = must(harness.wrapper.findAll('.nut-dl-grid__item')[0])
    expect(item.find('.nut-dl-grid__select').exists()).toBeTruthy()
    expect(item.find('.custom-card').find('input').exists()).toBeFalsy()
  })
})

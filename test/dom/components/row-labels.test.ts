import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'
import type { GenericObject } from '#ui-tools/table/types'

import { must } from '../../helpers/must'
import { asAccount, createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'
import { localeCode } from '../stubs/nuxt-ui-locale'

let harness: Harness | undefined
afterEach(() => {
  harness?.unmount()
  localeCode.value = 'fr'
})

function mountTable(options: Omit<Parameters<typeof mountLoaded>[0], 'render'>) {
  return mountLoaded({
    ...options,
    render: () => h(TableRenderer, { height: '400px' }),
  })
}

function rowControls(mounted: Harness, index: number) {
  const row = must(mounted.wrapper.findAll('tbody tr.nut-dl-row')[index])
  return {
    actions: row.find('td[data-col="__row-actions"] .nut-dl-rowbtn').attributes('aria-label'),
    select: row.find('td[data-col="__select"] input').attributes('aria-label'),
  }
}

describe('record-specific accessible names', () => {
  it('names the checkbox and the actions button of a row after its record', async () => {
    harness = await mountTable({ schema: createAccountsSchema({ rowLabel: true }) })
    expect(rowControls(harness, 0)).toStrictEqual({
      actions: 'Actions pour Compte 001',
      select: 'Sélectionner Compte 001',
    })
    expect(rowControls(harness, 1)).toStrictEqual({
      actions: 'Actions pour Compte 002',
      select: 'Sélectionner Compte 002',
    })
  })

  it('names the select-all checkbox for what it does', async () => {
    harness = await mountTable({ schema: createAccountsSchema({ rowLabel: true }) })
    expect(harness.wrapper.find('th[data-col="__select"] input').attributes('aria-label')).toBe(
      'Sélectionner toutes les lignes',
    )
  })

  it('falls back to the position on the page without a `rowLabel`', async () => {
    harness = await mountTable({ schema: createAccountsSchema() })
    expect(rowControls(harness, 0)).toStrictEqual({
      actions: 'Actions pour la ligne 1',
      select: 'Sélectionner la ligne 1',
    })
    expect(rowControls(harness, 4)).toStrictEqual({
      actions: 'Actions pour la ligne 5',
      select: 'Sélectionner la ligne 5',
    })
  })

  it('falls back to the position for a record `rowLabel` has no label for', async () => {
    const schema = createAccountsSchema()
    Object.assign(schema, {
      rowLabel: (row: GenericObject) => {
        const { id, name } = asAccount(row)
        if (id === 'acc-2') return null
        if (id === 'acc-3') return '  '
        return name
      },
    })
    harness = await mountTable({ schema })
    expect([
      rowControls(harness, 0).select,
      rowControls(harness, 1).select,
      rowControls(harness, 2).select,
      rowControls(harness, 1).actions,
    ]).toStrictEqual([
      'Sélectionner Compte 001',
      'Sélectionner la ligne 2',
      'Sélectionner la ligne 3',
      'Actions pour la ligne 2',
    ])
  })

  it('accepts numeric labels', async () => {
    const schema = createAccountsSchema()
    Object.assign(schema, { rowLabel: (row: GenericObject) => asAccount(row).contracts })
    harness = await mountTable({ schema })
    expect(rowControls(harness, 0).select).toBe('Sélectionner 1')
  })

  it('follows the locale', async () => {
    localeCode.value = 'en'
    harness = await mountTable({ schema: createAccountsSchema({ rowLabel: true }) })
    expect(rowControls(harness, 0)).toStrictEqual({
      actions: 'Actions for Compte 001',
      select: 'Select Compte 001',
    })
    expect(harness.wrapper.find('th[data-col="__select"] input').attributes('aria-label')).toBe(
      'Select all rows',
    )
    harness.unmount()

    harness = await mountTable({ schema: createAccountsSchema() })
    expect(rowControls(harness, 1)).toStrictEqual({
      actions: 'Actions for row 2',
      select: 'Select row 2',
    })
  })

  it('titles the mobile actions sheet with the record', async () => {
    harness = await mountTable({
      breakpoint: 'sm',
      schema: createAccountsSchema({ rowLabel: true }),
    })
    const first = must(harness.wrapper.findAll('tbody tr.nut-dl-row')[0])
    const sheet = first.find('[data-ui="UDrawer"]')
    expect(sheet.attributes('data-open')).toBe('false')
    await sheet.find('[data-ui-trigger]').trigger('click')
    await harness.flush()
    expect(
      must(harness.wrapper.findAll('tbody tr.nut-dl-row')[0])
        .find('[data-ui="UDrawer"] [data-ui-title]')
        .text(),
    ).toBe('Actions pour Compte 001')
  })
})

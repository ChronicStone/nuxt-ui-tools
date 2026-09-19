import { afterEach, describe, expect, it } from 'vitest'

import { createAccountsSchema, STATUS_COLOR } from '../fixtures/accounts'
import type { AccountRow } from '../fixtures/accounts'
import { mountLoaded, rows } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table filters', () => {
  it('exposes definitions and empty previews', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { filters } = harness.internals
    expect(filters.definitions.value.map((definition) => definition.key)).toStrictEqual([
      'status',
      'country',
      'edofSync',
    ])
    expect(filters.hasActiveUiFilters.value).toBeFalsy()
    const preview = filters.getFilterPreview({ key: 'status' })
    expect(preview).toMatchObject({
      active: false,
      count: 0,
      dirty: false,
      entries: [],
      summary: '',
      tags: [],
    })
    expect(filters.getFilterPreview({ key: 'unknown' }).active).toBeFalsy()
  })

  it('treats default values as active but not dirty', async () => {
    harness = await mountLoaded({
      schema: createAccountsSchema({ statusDefault: ['active', 'pending'] }),
    })
    const { filters } = harness.internals
    const preview = filters.getFilterPreview({
      entries: [
        { color: STATUS_COLOR.active, label: 'Actif', value: 'active' },
        { color: STATUS_COLOR.pending, label: 'En attente', value: 'pending' },
      ],
      key: 'status',
    })
    expect(preview.active).toBeTruthy()
    expect(preview.dirty).toBeFalsy()
    expect([preview.tags, preview.entries]).toEqual([
      ['Actif', 'En attente'],
      [
        { color: STATUS_COLOR.active, icon: undefined, label: 'Actif' },
        { color: STATUS_COLOR.pending, icon: undefined, label: 'En attente' },
      ],
    ])
    expect(filters.hasActiveUiFilters.value).toBeFalsy()
    expect([
      harness.query()['f.ui.status'],
      harness.internals.queryContent.data.value.rowCount,
    ]).toEqual([undefined, 40])

    filters.toggleOptionFilterValue({ key: 'status', value: 'pending' })
    await harness.flush()
    expect(filters.getFilterPreview({ key: 'status' }).dirty).toBeTruthy()
    expect(filters.hasActiveUiFilters.value).toBeTruthy()
    expect(harness.query()['f.ui.status']).toBeDefined()
    expect(harness.internals.queryContent.data.value.rowCount).toBe(20)

    filters.toggleOptionFilterValue({ key: 'status', value: 'pending' })
    await harness.flush()
    expect(filters.getFilterPreview({ key: 'status' }).dirty).toBeFalsy()
    expect(harness.query()['f.ui.status']).toBeUndefined()
  })

  it('sets, toggles and clears option filters while filtering rows', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { filters } = harness.internals
    filters.setOptionFilterValues({ key: 'country', values: ['FR', 'DE'] })
    await harness.flush()
    expect([
      filters.getFilterState({ key: 'country' }),
      filters.activeUiFilters.value.length,
      harness.internals.queryContent.data.value.rowCount,
      filters.getFilterPreview({ key: 'country' }),
    ]).toEqual([
      expect.objectContaining({
        key: 'country',
        operator: 'isAnyOf',
        value: ['FR', 'DE'],
      }),
      1,
      40,
      expect.objectContaining({
        active: true,
        count: 2,
        tags: ['FR', 'DE'],
      }),
    ])

    filters.toggleOptionFilterValue({ key: 'country', value: 'FR' })
    await harness.flush()
    expect([
      [
        filters.getFilterState({ key: 'country' })?.value,
        harness.internals.queryContent.data.value.rowCount,
      ],
      filters.getFilterPreview({ key: 'country' }),
    ]).toEqual([
      [['DE'], 20],
      expect.objectContaining({
        count: 1,
        summary: '',
        tags: ['DE'],
      }),
    ])

    filters.setOptionFilterValues({ key: 'country', values: [] })
    await harness.flush()
    expect([
      filters.getFilterState({ key: 'country' }),
      harness.internals.queryContent.data.value.rowCount,
    ]).toEqual([undefined, 60])
  })

  it('handles operators and scalar values', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { filters } = harness.internals
    expect([
      filters.getFilterOperator({ key: 'country' }),
      filters.getFilterOperatorOptions({ key: 'country' }).map((item) => item.label),
    ]).toEqual(['isAnyOf', ['parmi', 'est', "n'est pas"]])
    filters.setOptionFilterValues({ key: 'country', operator: 'isNot', values: ['FR'] })
    await harness.flush()
    expect([
      filters.getFilterOperator({ key: 'country' }),
      harness.internals.queryContent.data.value.rowCount,
    ]).toEqual(['isNot', 40])
    expect(harness.query()['f.ui.country~isNot']).toBeDefined()

    filters.setScalarFilterValue({ key: 'edofSync', value: true })
    await harness.flush()
    expect([
      filters.getFilterPreview({ key: 'edofSync' }),
      harness.internals.queryContent.data.value.rowCount,
    ]).toEqual([
      expect.objectContaining({
        active: true,
        summary: 'Oui',
      }),
      20,
    ])

    filters.setScalarFilterValue({ key: 'edofSync', value: null })
    await harness.flush()
    expect(filters.getFilterState({ key: 'edofSync' })).toBeUndefined()
  })

  it('searches over the configured fields and syncs the URL', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { filters } = harness.internals
    expect(filters.searchPlaceholder.value).toBe('Rechercher un compte…')
    filters.searchQuery.value = 'Compte 00'
    await harness.flush()
    expect(filters.hasActiveSearch.value).toBeTruthy()
    expect(harness.query()['f.search']).toBe('Compte 00')
    expect(harness.internals.queryContent.data.value.rowCount).toBe(9)
    filters.searchQuery.value = 'Entité 12'
    await harness.flush()
    expect(rows<AccountRow>(harness).map((row) => row.id)).toStrictEqual(['acc-12'])
  })

  it('clears every filter at once and replaces rule sets', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ statusDefault: ['active'] }) })
    const { filters } = harness.internals
    filters.setOptionFilterValues({ key: 'country', values: ['FR'] })
    filters.setScalarFilterValue({ key: 'edofSync', value: false })
    await harness.flush()
    expect(filters.activeUiFilters.value).toHaveLength(2)
    filters.clearAllFilters()
    await harness.flush()
    expect(filters.activeUiFilters.value).toHaveLength(0)
    expect(filters.getFilterState({ key: 'status' })?.value).toStrictEqual(['active'])

    filters.replaceFilters({ rules: [{ key: 'country', operator: 'isAnyOf', value: ['ES'] }] })
    await harness.flush()
    expect([
      filters.getFilterState({ key: 'country' })?.value,
      harness.table.filters.activeCount.value,
    ]).toEqual([['ES'], 1])
    harness.table.filters.remove('country')
    await harness.flush()
    expect(harness.table.filters.activeCount.value).toBe(0)
  })

  it('restores filters from the URL', async () => {
    harness = await mountLoaded({
      query: { 'f.search': 'Compte', 'f.ui.country': 'FR,ES' },
      schema: createAccountsSchema(),
    })
    expect(harness.internals.filters.getFilterState({ key: 'country' })?.value).toStrictEqual([
      'FR',
      'ES',
    ])
    expect(harness.internals.filters.searchQuery.value).toBe('Compte')
    expect(harness.internals.queryContent.data.value.rowCount).toBe(40)
  })

  it('resolves option entries and labels', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { filters } = harness.internals
    const entries = filters.getFilterOptionEntries({ key: 'status' })
    expect(entries.map((entry) => entry.label)).toStrictEqual(['Actif', 'En attente', 'Inactif'])
    expect(filters.getFilterLabelText({ label: () => 'Dyn' })).toBe('Dyn')
    expect(
      filters.getDefaultFilterValueForOperator({ key: 'country', operator: 'is' }),
    ).toBeDefined()
  })
})

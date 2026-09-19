import { afterEach, describe, expect, it } from 'vitest'

import { createAccountsSchema, type AccountRow, STATUS_COLOR } from '../fixtures/accounts'
import { mountLoaded, type Harness, rows } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table filters', () => {
  it('exposes definitions and empty previews', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const filters = harness.internals.filters
    expect(filters.definitions.value.map((definition) => definition.key)).toEqual(['status', 'country', 'edofSync'])
    expect(filters.hasActiveUiFilters.value).toBe(false)
    const preview = filters.getFilterPreview({ key: 'status' })
    expect(preview).toMatchObject({ active: false, dirty: false, count: 0, tags: [], entries: [], summary: '' })
    expect(filters.getFilterPreview({ key: 'unknown' }).active).toBe(false)
  })

  it('treats default values as active but not dirty', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ statusDefault: ['active', 'pending'] }) })
    const filters = harness.internals.filters
    const preview = filters.getFilterPreview({
      key: 'status',
      entries: [
        { label: 'Actif', value: 'active', color: STATUS_COLOR.active },
        { label: 'En attente', value: 'pending', color: STATUS_COLOR.pending },
      ],
    })
    expect(preview.active).toBe(true)
    expect(preview.dirty).toBe(false)
    expect(preview.tags).toEqual(['Actif', 'En attente'])
    expect(preview.entries).toEqual([
      { label: 'Actif', icon: undefined, color: STATUS_COLOR.active },
      { label: 'En attente', icon: undefined, color: STATUS_COLOR.pending },
    ])
    expect(filters.hasActiveUiFilters.value).toBe(false)
    expect(harness.query()['f.ui.status']).toBeUndefined()
    expect(harness.internals.queryContent.data.value.rowCount).toBe(40)

    filters.toggleOptionFilterValue({ key: 'status', value: 'pending' })
    await harness.flush()
    expect(filters.getFilterPreview({ key: 'status' }).dirty).toBe(true)
    expect(filters.hasActiveUiFilters.value).toBe(true)
    expect(harness.query()['f.ui.status']).toBeDefined()
    expect(harness.internals.queryContent.data.value.rowCount).toBe(20)

    filters.toggleOptionFilterValue({ key: 'status', value: 'pending' })
    await harness.flush()
    expect(filters.getFilterPreview({ key: 'status' }).dirty).toBe(false)
    expect(harness.query()['f.ui.status']).toBeUndefined()
  })

  it('sets, toggles and clears option filters while filtering rows', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const filters = harness.internals.filters
    filters.setOptionFilterValues({ key: 'country', values: ['FR', 'DE'] })
    await harness.flush()
    expect(filters.getFilterState({ key: 'country' })).toMatchObject({ key: 'country', operator: 'isAnyOf', value: ['FR', 'DE'] })
    expect(filters.activeUiFilters.value).toHaveLength(1)
    expect(harness.internals.queryContent.data.value.rowCount).toBe(40)
    expect(filters.getFilterPreview({ key: 'country' })).toMatchObject({ active: true, count: 2, tags: ['FR', 'DE'] })

    filters.toggleOptionFilterValue({ key: 'country', value: 'FR' })
    await harness.flush()
    expect(filters.getFilterState({ key: 'country' })?.value).toEqual(['DE'])
    expect(harness.internals.queryContent.data.value.rowCount).toBe(20)
    expect(filters.getFilterPreview({ key: 'country' })).toMatchObject({ tags: ['DE'], summary: '', count: 1 })

    filters.setOptionFilterValues({ key: 'country', values: [] })
    await harness.flush()
    expect(filters.getFilterState({ key: 'country' })).toBeUndefined()
    expect(harness.internals.queryContent.data.value.rowCount).toBe(60)
  })

  it('handles operators and scalar values', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const filters = harness.internals.filters
    expect(filters.getFilterOperator({ key: 'country' })).toBe('isAnyOf')
    expect(filters.getFilterOperatorOptions({ key: 'country' }).map((item) => item.label)).toEqual(['parmi', 'est', "n'est pas"])
    filters.setOptionFilterValues({ key: 'country', values: ['FR'], operator: 'isNot' })
    await harness.flush()
    expect(filters.getFilterOperator({ key: 'country' })).toBe('isNot')
    expect(harness.internals.queryContent.data.value.rowCount).toBe(40)
    expect(harness.query()['f.ui.country~isNot']).toBeDefined()

    filters.setScalarFilterValue({ key: 'edofSync', value: true })
    await harness.flush()
    expect(filters.getFilterPreview({ key: 'edofSync' })).toMatchObject({ active: true, summary: 'Oui' })
    expect(harness.internals.queryContent.data.value.rowCount).toBe(20)

    filters.setScalarFilterValue({ key: 'edofSync', value: null })
    await harness.flush()
    expect(filters.getFilterState({ key: 'edofSync' })).toBeUndefined()
  })

  it('searches over the configured fields and syncs the URL', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const filters = harness.internals.filters
    expect(filters.searchPlaceholder.value).toBe('Rechercher un compte…')
    filters.searchQuery.value = 'Compte 00'
    await harness.flush()
    expect(filters.hasActiveSearch.value).toBe(true)
    expect(harness.query()['f.search']).toBe('Compte 00')
    expect(harness.internals.queryContent.data.value.rowCount).toBe(9)
    filters.searchQuery.value = 'Entité 12'
    await harness.flush()
    expect(rows<AccountRow>(harness).map((row) => row.id)).toEqual(['acc-12'])
  })

  it('clears every filter at once and replaces rule sets', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ statusDefault: ['active'] }) })
    const filters = harness.internals.filters
    filters.setOptionFilterValues({ key: 'country', values: ['FR'] })
    filters.setScalarFilterValue({ key: 'edofSync', value: false })
    await harness.flush()
    expect(filters.activeUiFilters.value).toHaveLength(2)
    filters.clearAllFilters()
    await harness.flush()
    expect(filters.activeUiFilters.value).toHaveLength(0)
    expect(filters.getFilterState({ key: 'status' })?.value).toEqual(['active'])

    filters.replaceFilters({ rules: [{ key: 'country', operator: 'isAnyOf', value: ['ES'] }] })
    await harness.flush()
    expect(filters.getFilterState({ key: 'country' })?.value).toEqual(['ES'])
    expect(harness.table.filters.activeCount.value).toBe(1)
    harness.table.filters.remove('country')
    await harness.flush()
    expect(harness.table.filters.activeCount.value).toBe(0)
  })

  it('restores filters from the URL', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema(), query: { 'f.ui.country': 'FR,ES', 'f.search': 'Compte' } })
    expect(harness.internals.filters.getFilterState({ key: 'country' })?.value).toEqual(['FR', 'ES'])
    expect(harness.internals.filters.searchQuery.value).toBe('Compte')
    expect(harness.internals.queryContent.data.value.rowCount).toBe(40)
  })

  it('resolves option entries and labels', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const filters = harness.internals.filters
    const entries = filters.getFilterOptionEntries({ key: 'status' })
    expect(entries.map((entry) => entry.label)).toEqual(['Actif', 'En attente', 'Inactif'])
    expect(filters.getFilterLabelText({ label: () => 'Dyn' })).toBe('Dyn')
    expect(filters.getDefaultFilterValueForOperator({ key: 'country', operator: 'is' })).toBeDefined()
  })
})

import { afterEach, describe, expect, it } from 'vitest'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, type Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('filter presentation', () => {
  it('partitions definitions by display location and order', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ panelFilters: true }) })
    const presentation = harness.internals.filterPresentation
    expect(presentation.tagDefinitions.value.map((definition) => definition.key)).toEqual(['status'])
    expect(presentation.dormantDynamicDefinitions.value.map((definition) => definition.key)).toEqual(['edofSync'])
    expect(presentation.activeDynamicDefinitions.value).toEqual([])
    expect(presentation.panelDefinitions.value.map((definition) => definition.key)).toEqual(['country', 'legalEntity', 'contracts'])
    expect(presentation.hasPanelFilters.value).toBe(true)
    expect(presentation.panelSections.value.map((section) => section.label)).toEqual(['Identité', 'Volumes'])
    expect(presentation.panelSections.value[0]?.items.map((item) => item.key)).toEqual(['country', 'legalEntity'])
    expect(presentation.resolved.value.find((item) => item.key === 'edofSync')).toMatchObject({ location: 'tag-dynamic', visible: false, active: false })
    expect(presentation.resolved.value.find((item) => item.key === 'country')).toMatchObject({ location: 'panel', visible: true, group: 'Identité' })
  })

  it('runs a dynamic filter session and promotes the filter once it holds a value', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const presentation = harness.internals.filterPresentation
    presentation.activateDynamicFilter({ key: 'country' })
    expect(presentation.dynamicSessionDefinition.value?.key).toBe('country')
    expect(presentation.dormantDynamicDefinitions.value.map((definition) => definition.key)).toEqual(['edofSync'])
    expect(presentation.activeDynamicDefinitions.value).toEqual([])

    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['FR'] })
    await harness.flush()
    presentation.releaseDynamicSession({ key: 'country' })
    expect(presentation.dynamicSessionDefinition.value).toBeUndefined()
    expect(presentation.activeDynamicDefinitions.value.map((definition) => definition.key)).toEqual(['country'])
    expect(presentation.dormantDynamicDefinitions.value.map((definition) => definition.key)).toEqual(['edofSync'])

    presentation.releaseDynamicSession({ key: 'edofSync' })
    harness.internals.filters.clearFilter({ key: 'country' })
    await harness.flush()
    expect(presentation.dormantDynamicDefinitions.value.map((definition) => definition.key)).toEqual(['country', 'edofSync'])
  })

  it('drafts panel filters and commits them on apply', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ panelFilters: true }) })
    const presentation = harness.internals.filterPresentation
    expect(presentation.panelCommitMode.value).toBe('submit')
    presentation.openPanel()
    expect(presentation.panelOpen.value).toBe(true)
    presentation.setPanelScalarFilterValue({ key: 'legalEntity', value: 'Entité 1' })
    expect(presentation.getPanelDraftFilterState({ key: 'legalEntity' })).toMatchObject({ key: 'legalEntity', value: 'Entité 1', operator: 'contains' })
    expect(harness.internals.filters.getFilterState({ key: 'legalEntity' })).toBeUndefined()
    expect(presentation.activePanelCount.value).toBe(0)

    presentation.applyPanelDraft()
    await harness.flush()
    expect(presentation.panelOpen.value).toBe(false)
    expect(harness.internals.filters.getFilterState({ key: 'legalEntity' })?.value).toBe('Entité 1')
    expect(presentation.activePanelCount.value).toBe(1)
    expect(harness.internals.queryContent.data.value.rowCount).toBe(11)

    presentation.openPanel()
    presentation.setPanelFilterOperator({ key: 'legalEntity', operator: 'is' })
    expect(presentation.getPanelFilterOperator({ key: 'legalEntity' })).toBe('is')
    presentation.clearPanelFilter({ key: 'legalEntity' })
    expect(presentation.getPanelDraftFilterState({ key: 'legalEntity' })).toBeUndefined()
    presentation.resetPanelDraft()
    expect(presentation.getPanelDraftFilterState({ key: 'legalEntity' })?.value).toBe('Entité 1')
    presentation.clearPanelDraft()
    presentation.commitPanelDraft({ close: false })
    await harness.flush()
    expect(presentation.panelOpen.value).toBe(true)
    expect(harness.internals.filters.getFilterState({ key: 'legalEntity' })).toBeUndefined()
    presentation.closePanel()
    expect(presentation.panelOpen.value).toBe(false)
  })

  it('commits immediately in live mode and keeps tag filters untouched', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ panelFilters: true }) })
    const presentation = harness.internals.filterPresentation
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['FR'] })
    await harness.flush()
    presentation.setPanelCommitMode('live')
    presentation.openPanel()
    presentation.setPanelScalarFilterValue({ key: 'contracts', value: 3, operator: 'gte' })
    await harness.flush()
    expect(harness.internals.filters.getFilterState({ key: 'contracts' })).toMatchObject({ value: 3, operator: 'gte' })
    expect(harness.internals.filters.getFilterState({ key: 'country' })?.value).toEqual(['FR'])
    expect(presentation.panelOpen.value).toBe(true)
    presentation.setPanelOptionFilterValues({ key: 'contracts', values: [] })
    await harness.flush()
    expect(harness.internals.filters.getFilterState({ key: 'contracts' })).toBeUndefined()
  })
})

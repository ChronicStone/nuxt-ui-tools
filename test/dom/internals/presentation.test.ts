import { afterEach, describe, expect, it } from 'vitest'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('filter presentation', () => {
  it('partitions definitions by display location and order', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ panelFilters: true }) })
    const presentation = harness.internals.filterPresentation
    expect([
      presentation.tagDefinitions.value.map((definition) => definition.key),
      presentation.dormantDynamicDefinitions.value.map((definition) => definition.key),
      presentation.activeDynamicDefinitions.value,
      presentation.panelDefinitions.value.map((definition) => definition.key),
    ]).toEqual([['status'], ['edofSync'], [], ['country', 'legalEntity', 'contracts']])
    expect(presentation.hasPanelFilters.value).toBeTruthy()
    expect([
      presentation.panelSections.value.map((section) => section.label),
      presentation.panelSections.value[0]?.items.map((item) => item.key),
    ]).toEqual([
      ['Identité', 'Volumes'],
      ['country', 'legalEntity'],
    ])
    expect(presentation.resolved.value.find((item) => item.key === 'edofSync')).toMatchObject({
      active: false,
      location: 'tag-dynamic',
      visible: false,
    })
    expect(presentation.resolved.value.find((item) => item.key === 'country')).toMatchObject({
      group: 'Identité',
      location: 'panel',
      visible: true,
    })
  })

  it('runs a dynamic filter session and promotes the filter once it holds a value', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const presentation = harness.internals.filterPresentation
    presentation.activateDynamicFilter({ key: 'country' })
    expect([
      presentation.dynamicSessionDefinition.value?.key,
      presentation.dormantDynamicDefinitions.value.map((definition) => definition.key),
      presentation.activeDynamicDefinitions.value,
    ]).toEqual(['country', ['edofSync'], []])

    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['FR'] })
    await harness.flush()
    presentation.releaseDynamicSession({ key: 'country' })
    expect(presentation.dynamicSessionDefinition.value).toBeUndefined()
    expect([
      presentation.activeDynamicDefinitions.value.map((definition) => definition.key),
      presentation.dormantDynamicDefinitions.value.map((definition) => definition.key),
    ]).toEqual([['country'], ['edofSync']])

    presentation.releaseDynamicSession({ key: 'edofSync' })
    harness.internals.filters.clearFilter({ key: 'country' })
    await harness.flush()
    expect(
      presentation.dormantDynamicDefinitions.value.map((definition) => definition.key),
    ).toStrictEqual(['country', 'edofSync'])
  })

  it('drafts panel filters and commits them on apply', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ panelFilters: true }) })
    const presentation = harness.internals.filterPresentation
    expect(presentation.panelCommitMode.value).toBe('submit')
    presentation.openPanel()
    expect(presentation.panelOpen.value).toBeTruthy()
    presentation.setPanelScalarFilterValue({ key: 'legalEntity', value: 'Entité 1' })
    expect([
      presentation.getPanelDraftFilterState({ key: 'legalEntity' }),
      harness.internals.filters.getFilterState({ key: 'legalEntity' }),
      presentation.activePanelCount.value,
    ]).toEqual([
      expect.objectContaining({
        key: 'legalEntity',
        operator: 'contains',
        value: 'Entité 1',
      }),
      undefined,
      0,
    ])

    presentation.applyPanelDraft()
    await harness.flush()
    expect(presentation.panelOpen.value).toBeFalsy()
    expect([
      harness.internals.filters.getFilterState({ key: 'legalEntity' })?.value,
      presentation.activePanelCount.value,
      harness.internals.queryContent.data.value.rowCount,
    ]).toEqual(['Entité 1', 1, 11])

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
    expect(presentation.panelOpen.value).toBeTruthy()
    expect(harness.internals.filters.getFilterState({ key: 'legalEntity' })).toBeUndefined()
    presentation.closePanel()
    expect(presentation.panelOpen.value).toBeFalsy()
  })

  it('commits immediately in live mode and keeps tag filters untouched', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ panelFilters: true }) })
    const presentation = harness.internals.filterPresentation
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['FR'] })
    await harness.flush()
    presentation.setPanelCommitMode('live')
    presentation.openPanel()
    presentation.setPanelScalarFilterValue({ key: 'contracts', operator: 'gte', value: 3 })
    await harness.flush()
    expect(harness.internals.filters.getFilterState({ key: 'contracts' })).toMatchObject({
      operator: 'gte',
      value: 3,
    })
    expect(harness.internals.filters.getFilterState({ key: 'country' })?.value).toStrictEqual([
      'FR',
    ])
    expect(presentation.panelOpen.value).toBeTruthy()
    presentation.setPanelOptionFilterValues({ key: 'contracts', values: [] })
    await harness.flush()
    expect(harness.internals.filters.getFilterState({ key: 'contracts' })).toBeUndefined()
  })
})

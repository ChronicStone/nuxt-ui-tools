import { describe, expect, it } from 'vitest'

import {
  hasConfiguredTableActions,
  resolveTableActionDefinitions,
} from '../../src/runtime/table/utils/actions'

describe('table selection action contract', () => {
  it('does not enable selection for tables without applicable actions', () => {
    expect(hasConfiguredTableActions({})).toBe(false)
    expect(hasConfiguredTableActions({ actions: [] })).toBe(false)
    expect(hasConfiguredTableActions({ toolbarActions: [] })).toBe(false)
    expect(hasConfiguredTableActions({ rowActions: [] })).toBe(false)
  })

  it('enables selection only when a bulk action can consume selected rows', () => {
    expect(hasConfiguredTableActions({ actions: [{ key: 'archive' }] })).toBe(true)
    expect(hasConfiguredTableActions({ toolbarActions: [{ key: 'refresh' }] })).toBe(false)
    expect(hasConfiguredTableActions({ rowActions: [{ key: 'open' }] })).toBe(false)
  })

  it('keeps bulk and toolbar definitions in separate rendering groups', () => {
    expect(
      resolveTableActionDefinitions({
        actions: [{ key: 'archive' }],
        toolbarActions: [{ key: 'refresh' }],
      }),
    ).toEqual({
      bulkActions: [{ key: 'archive' }],
      toolbarActions: [{ key: 'refresh' }],
    })
  })
})

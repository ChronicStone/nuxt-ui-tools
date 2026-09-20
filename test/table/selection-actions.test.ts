import { describe, expect, it } from 'vitest'

import {
  hasConfiguredTableActions,
  resolveTableActionDefinitions,
} from '../../src/runtime/table/utils/actions'

describe('table selection action contract', () => {
  it('does not enable selection for tables without applicable actions', () => {
    expect(hasConfiguredTableActions({})).toBeFalsy()
    expect(hasConfiguredTableActions({ actions: [] })).toBeFalsy()
    expect(hasConfiguredTableActions({ toolbarActions: [] })).toBeFalsy()
    expect(hasConfiguredTableActions({ rowActions: [] })).toBeFalsy()
  })

  it('enables selection only when a bulk action can consume selected rows', () => {
    expect(hasConfiguredTableActions({ actions: [{ key: 'archive' }] })).toBeTruthy()
    expect(hasConfiguredTableActions({ toolbarActions: [{ key: 'refresh' }] })).toBeFalsy()
    expect(hasConfiguredTableActions({ rowActions: [{ key: 'open' }] })).toBeFalsy()
  })

  it('keeps bulk and toolbar definitions in separate rendering groups', () => {
    expect(
      resolveTableActionDefinitions({
        actions: [{ key: 'archive' }],
        toolbarActions: [{ key: 'refresh' }],
      }),
    ).toStrictEqual({
      bulkActions: [{ key: 'archive' }],
      toolbarActions: [{ key: 'refresh' }],
    })
  })
})

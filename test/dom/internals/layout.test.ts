import { afterEach, describe, expect, it } from 'vitest'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, type Harness } from '../harness'
import { setBreakpoint } from '../nuxt-state'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table layout', () => {
  it('defaults to the schema layout without writing the URL', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    expect(harness.internals.layout.activeLayout.value).toBe('table')
    expect(harness.internals.layout.tableEnabled.value).toBe(true)
    expect(harness.internals.layout.gridEnabled.value).toBe(true)
    expect(harness.query().l).toBeUndefined()
  })

  it('persists an explicit layout choice in the URL and reads it back', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    harness.internals.controls.setTableLayout('grid')
    await harness.flush()
    expect(harness.internals.controls.tableLayout.value).toBe('grid')
    expect(harness.query().l).toBe('grid')
    harness.unmount()

    harness = await mountLoaded({ schema: createAccountsSchema(), query: { l: 'grid' } })
    expect(harness.internals.controls.tableLayout.value).toBe('grid')
    expect(harness.internals.controls.layoutState.value).toEqual({
      active: 'grid',
      available: ['table', 'grid'],
    })
  })

  it('forces grid on mobile when the table is responsive-disabled without persisting it', async () => {
    harness = await mountLoaded({
      schema: createAccountsSchema({ tableEnabled: 'false md:true' }),
      breakpoint: 'sm',
    })
    expect(harness.internals.layout.tableEnabled.value).toBe(false)
    expect(harness.internals.controls.tableLayout.value).toBe('grid')
    expect(harness.internals.controls.layoutState.value.available).toEqual(['grid'])
    expect(harness.query().l).toBeUndefined()

    setBreakpoint('xl')
    await harness.flush()
    expect(harness.internals.layout.tableEnabled.value).toBe(true)
    expect(harness.internals.controls.tableLayout.value).toBe('table')
  })

  it('falls back to the table when the grid is disabled but requested', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ grid: false }), query: { l: 'grid' } })
    expect(harness.internals.layout.gridEnabled.value).toBe(false)
    expect(harness.internals.controls.tableLayout.value).toBe('table')
    expect(harness.internals.controls.layoutState.value.available).toEqual(['table'])
  })

  it('exposes column panel controls', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    expect(harness.internals.controls.columnsPanelOpen.value).toBe(false)
    harness.internals.controls.columnsPanelOpen.value = true
    harness.internals.controls.columnsPanelSearch.value = 'pays'
    expect(harness.internals.controls.columnsPanelOpen.value).toBe(true)
    expect(harness.internals.controls.columnsPanelSearch.value).toBe('pays')
  })
})

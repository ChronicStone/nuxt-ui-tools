import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { useDataListBreakpoint } from '#ui-tools/table/composables/use-data-list-breakpoint'

import { must } from '../../helpers/must'
import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'
import { setBreakpoint } from '../nuxt-state'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('grid geometry', () => {
  it('resolves responsive grid columns and chunks rows accordingly', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { grid } = harness.internals
    expect(grid.mode.value).toBe('contained')
    expect(grid.columnCount.value).toBe(3)
    expect(grid.itemColumnSpan.value).toBe(1)
    expect(grid.cardsPerRow.value).toBe(3)
    expect(grid.rowChunks.value).toHaveLength(7)
    expect(grid.rowChunks.value[0]).toMatchObject({ end: 3, index: 0, start: 0 })
    expect(grid.rowChunks.value.at(-1)?.rows).toHaveLength(2)

    setBreakpoint('md')
    await harness.flush()
    expect(grid.columnCount.value).toBe(2)
    expect(grid.rowChunks.value).toHaveLength(10)

    setBreakpoint('sm')
    await harness.flush()
    expect(grid.columnCount.value).toBe(1)
    expect(grid.rowChunks.value).toHaveLength(20)
  })
})

describe('breakpoint composable', () => {
  const Probe = defineComponent({
    setup() {
      const state = useDataListBreakpoint()
      return () =>
        h('div', {
          'data-mobile': String(state.isMobile.value),
          'data-tablet': String(state.isTablet.value),
        })
    },
  })

  it('reports mobile and tablet ranges from the viewport', async () => {
    harness = await mountLoaded({
      breakpoint: 'sm',
      component: Probe,
      schema: createAccountsSchema(),
    })
    function probe() {
      return must(harness).wrapper.find('[data-mobile]')
    }
    expect(probe().attributes('data-mobile')).toBe('true')
    expect(probe().attributes('data-tablet')).toBe('false')
    setBreakpoint('md')
    await harness.flush()
    expect(probe().attributes('data-mobile')).toBe('false')
    expect(probe().attributes('data-tablet')).toBe('true')
    setBreakpoint('lg')
    await harness.flush()
    expect(probe().attributes('data-tablet')).toBe('false')
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { useDataListUi } from '#ui-tools/table/composables/use-data-list-ui'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, type Harness } from '../harness'
import { setBreakpoint } from '../nuxt-state'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const Probe = defineComponent({
  setup() {
    const state = useDataListUi()
    return () =>
      h('pre', {
        'data-size': state.controlSize.value,
        'data-density': state.density.value,
        'data-ui': JSON.stringify(state.ui.value),
      })
  },
})

function read(h: Harness) {
  const node = h.wrapper.find('pre')
  return {
    size: node.attributes('data-size'),
    density: node.attributes('data-density'),
    ui: JSON.parse(node.attributes('data-ui') ?? '{}') as Record<string, any>,
  }
}

describe('data list UI config', () => {
  it('maps density and size defaults', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema(), component: Probe })
    expect(read(harness)).toMatchObject({ size: 'md', density: 'default' })
    harness.unmount()
    harness = await mountLoaded({ schema: createAccountsSchema(), component: Probe, density: 'compact' })
    expect(read(harness)).toMatchObject({ size: 'sm', density: 'compact' })
    harness.unmount()
    harness = await mountLoaded({ schema: createAccountsSchema(), component: Probe, size: 'lg' })
    expect(read(harness)).toMatchObject({ size: 'lg', density: 'comfortable' })
  })

  it('merges app config, root props and nested part layers', async () => {
    harness = await mountLoaded({
      schema: createAccountsSchema(),
      component: Probe,
      appConfig: {
        nuxtUiTools: {
          dataList: {
            search: { width: '300px', props: { input: { color: 'neutral', variant: 'soft' } } },
            filterTags: { props: { icon: true, trigger: { size: 'xs' } }, ui: { trigger: 'app-trigger' } },
            table: { gutter: 12 },
          },
        },
      },
      ui: {
        search: { props: { input: { variant: 'outline' } } },
        filterTags: { props: { icon: false }, ui: { value: 'root-value' } },
        table: { gutter: 20, ui: { td: 'font-light' } },
      },
    })
    const { ui } = read(harness)
    expect(ui.search.width).toBe('300px')
    expect(ui.search.props.input).toEqual({ color: 'neutral', variant: 'outline' })
    expect(ui.filterTags.props).toEqual({ icon: false, trigger: { size: 'xs' } })
    expect(ui.filterTags.ui).toEqual({ trigger: 'app-trigger', value: 'root-value' })
    expect(ui.table.gutter).toBe(20)
    expect(ui.table.ui.td).toBe('font-light')
  })

  it('applies mobile overrides only below the md breakpoint', async () => {
    harness = await mountLoaded({
      schema: createAccountsSchema(),
      component: Probe,
      ui: {
        search: { width: '340px' },
        pagination: { size: 'sm', ui: { root: 'px-5' } },
        mobile: {
          control: { size: 'lg' },
          search: { width: '100%' },
          pagination: { size: 'md', ui: { root: 'px-4' } },
        },
      },
    })
    let state = read(harness)
    expect(state.size).toBe('md')
    expect(state.ui.search.width).toBe('340px')
    expect(state.ui.pagination.ui.root).toBe('px-5')

    setBreakpoint('sm')
    await harness.flush()
    state = read(harness)
    expect(state.size).toBe('lg')
    expect(state.density).toBe('comfortable')
    expect(state.ui.search.width).toBe('100%')
    expect(state.ui.pagination.size).toBe('md')
    expect(state.ui.pagination.ui.root).toBe('px-4')
    expect(state.ui.mobile).toBeDefined()
  })
})

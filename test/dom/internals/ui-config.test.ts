import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { useDataListUi } from '#ui-tools/table/composables/use-data-list-ui'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'
import { setBreakpoint } from '../nuxt-state'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const Probe = defineComponent({
  setup() {
    const state = useDataListUi()
    return () =>
      h('pre', {
        'data-density': state.density.value,
        'data-size': state.controlSize.value,
        'data-ui': JSON.stringify(state.ui.value),
      })
  },
})

function read(h: Harness) {
  const node = h.wrapper.find('pre')
  return {
    density: node.attributes('data-density'),
    size: node.attributes('data-size'),
    ui: JSON.parse(node.attributes('data-ui') ?? '{}') as Record<string, any>,
  }
}

describe('data list UI config', () => {
  it('maps density and size defaults', async () => {
    harness = await mountLoaded({ component: Probe, schema: createAccountsSchema() })
    expect(read(harness)).toMatchObject({ density: 'default', size: 'md' })
    harness.unmount()
    harness = await mountLoaded({
      component: Probe,
      density: 'compact',
      schema: createAccountsSchema(),
    })
    expect(read(harness)).toMatchObject({ density: 'compact', size: 'sm' })
    harness.unmount()
    harness = await mountLoaded({ component: Probe, schema: createAccountsSchema(), size: 'lg' })
    expect(read(harness)).toMatchObject({ density: 'comfortable', size: 'lg' })
  })

  it('merges app config, root props and nested part layers', async () => {
    harness = await mountLoaded({
      appConfig: {
        nuxtUiTools: {
          dataList: {
            filterTags: {
              props: { icon: true, trigger: { size: 'xs' } },
              ui: { trigger: 'app-trigger' },
            },
            search: { props: { input: { color: 'neutral', variant: 'soft' } }, width: '300px' },
            table: { gutter: 12 },
          },
        },
      },
      component: Probe,
      schema: createAccountsSchema(),
      ui: {
        filterTags: { props: { icon: false }, ui: { value: 'root-value' } },
        search: { props: { input: { variant: 'outline' } } },
        table: { gutter: 20, ui: { td: 'font-light' } },
      },
    })
    const { ui } = read(harness)
    expect([
      ui.search.width,
      ui.search.props.input,
      ui.filterTags.props,
      ui.filterTags.ui,
      ui.table.gutter,
      ui.table.ui.td,
    ]).toEqual([
      '300px',
      { color: 'neutral', variant: 'outline' },
      { icon: false, trigger: { size: 'xs' } },
      { trigger: 'app-trigger', value: 'root-value' },
      20,
      'font-light',
    ])
  })

  it('applies mobile overrides only below the md breakpoint', async () => {
    harness = await mountLoaded({
      component: Probe,
      schema: createAccountsSchema(),
      ui: {
        mobile: {
          control: { size: 'lg' },
          pagination: { size: 'md', ui: { root: 'px-4' } },
          search: { width: '100%' },
        },
        pagination: { size: 'sm', ui: { root: 'px-5' } },
        search: { width: '340px' },
      },
    })
    let state = read(harness)
    expect([state.size, state.ui.search.width, state.ui.pagination.ui.root]).toEqual([
      'md',
      '340px',
      'px-5',
    ])

    setBreakpoint('sm')
    await harness.flush()
    state = read(harness)
    expect([
      state.size,
      state.density,
      state.ui.search.width,
      state.ui.pagination.size,
      state.ui.pagination.ui.root,
    ]).toEqual(['lg', 'comfortable', '100%', 'md', 'px-4'])
    expect(state.ui.mobile).toBeDefined()
  })
})

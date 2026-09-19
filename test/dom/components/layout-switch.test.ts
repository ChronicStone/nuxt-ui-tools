import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListLayoutSwitch from '#ui-tools/table/components/data-list/DataListLayoutSwitch.vue'

import { must } from '../../helpers/must'
import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

function mountSwitch(
  options: Partial<Parameters<typeof mountLoaded>[0]> & {
    switchProps?: Record<string, unknown>
  } = {},
) {
  return mountLoaded({
    schema: createAccountsSchema(),
    ...options,
    render: () => h(DataListLayoutSwitch, options.switchProps),
  })
}

describe('layout switch part', () => {
  it('renders both layouts with the active one highlighted and switches on click', async () => {
    harness = await mountSwitch()
    const w = harness.wrapper
    expect(w.find('.nut-dl-layout').exists()).toBeTruthy()
    const buttons = w.findAll('.nut-dl-layout__btn')
    expect(buttons).toHaveLength(2)
    expect(buttons.map((b) => b.attributes('aria-label'))).toStrictEqual([
      'Vue tableau',
      'Vue grille',
    ])
    expect(buttons.map((b) => b.attributes('data-icon'))).toStrictEqual([
      'i-lucide-menu',
      'i-lucide-box',
    ])
    expect(must(buttons[0]).attributes('data-active')).toBe('true')
    expect(must(buttons[0]).attributes('data-variant')).toBe('soft')
    expect(must(buttons[1]).attributes('data-variant')).toBe('ghost')
    expect(must(buttons[0]).attributes('data-label')).toBeUndefined()
    await must(buttons[1]).trigger('click')
    await harness.flush()
    expect(harness.internals.controls.tableLayout.value).toBe('grid')
    expect(must(w.findAll('.nut-dl-layout__btn')[1]).attributes('data-active')).toBe('true')
  })

  it('honours order, labels, icons and props layers', async () => {
    harness = await mountSwitch({
      switchProps: { labels: true, order: ['grid', 'table'] },
      ui: {
        layoutSwitch: {
          props: {
            activeTrigger: { variant: 'ghost' },
            icons: { table: 'i-lucide-rows-3' },
            trigger: { color: 'neutral', variant: 'ghost' },
          },
          size: 'sm',
          ui: { root: 'root-x', trigger: 'btn-x' },
        },
      },
    })
    const buttons = harness.wrapper.findAll('.nut-dl-layout__btn')
    expect(buttons.map((b) => b.attributes('data-label'))).toStrictEqual(['Grid', 'Table'])
    expect(must(buttons[1]).attributes('data-icon')).toBe('i-lucide-rows-3')
    expect(must(buttons[1]).attributes('data-variant')).toBe('ghost')
    expect(must(buttons[1]).attributes('data-size')).toBe('sm')
    expect(must(buttons[1]).classes()).toContain('btn-x')
    expect(harness.wrapper.find('.nut-dl-layout').classes()).toContain('root-x')
  })

  it('hides itself on mobile unless allowed, and when a layout is unavailable', async () => {
    harness = await mountSwitch({ breakpoint: 'sm' })
    expect(harness.wrapper.find('.nut-dl-layout').exists()).toBeFalsy()
    harness.unmount()
    harness = await mountSwitch({ breakpoint: 'sm', switchProps: { mobile: true } })
    expect(harness.wrapper.find('.nut-dl-layout').exists()).toBeTruthy()
    harness.unmount()
    harness = await mountSwitch({ schema: createAccountsSchema({ grid: false }) })
    expect(harness.wrapper.find('.nut-dl-layout').exists()).toBeFalsy()
  })

  it('exposes layout state through its slot', async () => {
    harness = await mountLoaded({
      render: () =>
        h(DataListLayoutSwitch, null, {
          default: (scope: { layout: string; available: string[] }) =>
            h('i', `${scope.layout}:${scope.available.join(',')}`),
        }),
      schema: createAccountsSchema(),
    })
    expect(harness.wrapper.find('i').text()).toBe('table:table,grid')
  })
})

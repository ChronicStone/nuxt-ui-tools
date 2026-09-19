import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListLayoutSwitch from '#ui-tools/table/components/data-list/DataListLayoutSwitch.vue'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, type Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const mountSwitch = (options: Partial<Parameters<typeof mountLoaded>[0]> & { switchProps?: Record<string, unknown> } = {}) =>
  mountLoaded({ schema: createAccountsSchema(), ...options, render: () => h(DataListLayoutSwitch, options.switchProps) })

describe('DataListLayoutSwitch', () => {
  it('renders both layouts with the active one highlighted and switches on click', async () => {
    harness = await mountSwitch()
    const w = harness.wrapper
    expect(w.find('.nut-dl-layout').exists()).toBe(true)
    const buttons = w.findAll('.nut-dl-layout__btn')
    expect(buttons).toHaveLength(2)
    expect(buttons.map((b) => b.attributes('aria-label'))).toEqual(['Vue tableau', 'Vue grille'])
    expect(buttons.map((b) => b.attributes('data-icon'))).toEqual(['i-lucide-menu', 'i-lucide-box'])
    expect(buttons[0]!.attributes('data-active')).toBe('true')
    expect(buttons[0]!.attributes('data-variant')).toBe('soft')
    expect(buttons[1]!.attributes('data-variant')).toBe('ghost')
    expect(buttons[0]!.attributes('data-label')).toBeUndefined()
    await buttons[1]!.trigger('click')
    await harness.flush()
    expect(harness.internals.controls.tableLayout.value).toBe('grid')
    expect(w.findAll('.nut-dl-layout__btn')[1]!.attributes('data-active')).toBe('true')
  })

  it('honours order, labels, icons and props layers', async () => {
    harness = await mountSwitch({
      ui: { layoutSwitch: { size: 'sm', props: { trigger: { variant: 'ghost', color: 'neutral' }, activeTrigger: { variant: 'ghost' }, icons: { table: 'i-lucide-rows-3' } }, ui: { root: 'root-x', trigger: 'btn-x' } } },
      switchProps: { order: ['grid', 'table'], labels: true },
    })
    const buttons = harness.wrapper.findAll('.nut-dl-layout__btn')
    expect(buttons.map((b) => b.attributes('data-label'))).toEqual(['Grid', 'Table'])
    expect(buttons[1]!.attributes('data-icon')).toBe('i-lucide-rows-3')
    expect(buttons[1]!.attributes('data-variant')).toBe('ghost')
    expect(buttons[1]!.attributes('data-size')).toBe('sm')
    expect(buttons[1]!.classes()).toContain('btn-x')
    expect(harness.wrapper.find('.nut-dl-layout').classes()).toContain('root-x')
  })

  it('hides itself on mobile unless allowed, and when a layout is unavailable', async () => {
    harness = await mountSwitch({ breakpoint: 'sm' })
    expect(harness.wrapper.find('.nut-dl-layout').exists()).toBe(false)
    harness.unmount()
    harness = await mountSwitch({ breakpoint: 'sm', switchProps: { mobile: true } })
    expect(harness.wrapper.find('.nut-dl-layout').exists()).toBe(true)
    harness.unmount()
    harness = await mountSwitch({ schema: createAccountsSchema({ grid: false }) })
    expect(harness.wrapper.find('.nut-dl-layout').exists()).toBe(false)
  })

  it('exposes layout state through its slot', async () => {
    harness = await mountLoaded({
      schema: createAccountsSchema(),
      render: () => h(DataListLayoutSwitch, null, { default: (scope: { layout: string; available: string[] }) => h('i', `${scope.layout}:${scope.available.join(',')}`) }),
    })
    expect(harness.wrapper.find('i').text()).toBe('table:table,grid')
  })
})

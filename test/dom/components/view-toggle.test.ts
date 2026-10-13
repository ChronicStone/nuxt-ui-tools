import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import DataListContent from '#ui-tools/table/components/data-list/data-list-content.vue'
import DataListDefault from '#ui-tools/table/components/data-list/data-list-default.vue'
import DataListViewToggle from '#ui-tools/table/components/data-list/data-list-view-toggle.vue'

import { createAccountsSchema, createAuditSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'
import { setBreakpoint } from '../nuxt-state'
import { localeCode } from '../stubs/nuxt-ui-locale'

let harness: Harness | undefined
afterEach(() => {
  harness?.unmount()
  localeCode.value = 'fr'
})

function mountToggle(
  options: Partial<Parameters<typeof mountLoaded>[0]> & {
    toggleProps?: InstanceType<typeof DataListViewToggle>['$props']
  } = {},
) {
  return mountLoaded({
    breakpoint: 'sm',
    schema: createAccountsSchema({ summary: true }),
    ...options,
    render: () => h(DataListViewToggle, options.toggleProps),
  })
}

describe('view toggle part', () => {
  it('names the view it goes to and switches on click', async () => {
    harness = await mountToggle()
    const w = harness.wrapper
    const button = () => w.find('.nut-dl-view-toggle')
    expect([button().text(), harness.internals.rowSummary.active.value]).toStrictEqual([
      'Vue tableau',
      true,
    ])
    await button().trigger('click')
    await harness.flush()
    expect([button().text(), harness.internals.rowSummary.active.value]).toStrictEqual([
      'Vue liste',
      false,
    ])
    await button().trigger('click')
    await harness.flush()
    expect([button().text(), harness.internals.rowSummary.active.value]).toStrictEqual([
      'Vue tableau',
      true,
    ])
  })

  it('reads as a link button in the primary color', async () => {
    harness = await mountToggle()
    const button = harness.wrapper.find('.nut-dl-view-toggle')
    expect([
      button.attributes('data-variant'),
      button.attributes('data-color'),
      button.classes(),
    ]).toStrictEqual([
      'link',
      'primary',
      expect.arrayContaining(['nut-dl-view-toggle', 'font-semibold']),
    ])
  })

  it('merges the app layer under the part layer', async () => {
    harness = await mountToggle({
      toggleProps: { props: { button: { variant: 'ghost' } }, ui: { base: 'part-x' } },
      ui: {
        viewToggle: {
          props: { button: { color: 'neutral', variant: 'subtle' } },
          size: 'sm',
          ui: { base: 'app-x' },
        },
      },
    })
    const button = harness.wrapper.find('.nut-dl-view-toggle')
    expect([
      button.attributes('data-variant'),
      button.attributes('data-color'),
      button.attributes('data-size'),
    ]).toStrictEqual(['ghost', 'neutral', 'sm'])
    expect(button.classes()).toContain('part-x')
    expect(button.classes()).not.toContain('app-x')
  })

  it('follows the locale', async () => {
    localeCode.value = 'en'
    harness = await mountToggle()
    const button = () => harness?.wrapper.find('.nut-dl-view-toggle')
    expect(button()?.text()).toBe('Table view')
    await button()?.trigger('click')
    await harness.flush()
    expect(button()?.text()).toBe('List view')
  })

  it('draws nothing where summary rows are not available', async () => {
    harness = await mountToggle({ breakpoint: 'xl' })
    expect(harness.wrapper.find('.nut-dl-view-toggle').exists()).toBeFalsy()
    harness.unmount()

    harness = await mountToggle({ schema: createAccountsSchema() })
    expect(harness.wrapper.find('.nut-dl-view-toggle').exists()).toBeFalsy()
  })

  it('keeps no choice made while summary rows are not available', async () => {
    harness = await mountToggle({ breakpoint: 'xl' })
    harness.internals.rowSummary.setActive(false)
    setBreakpoint('sm')
    await harness.flush()
    expect(harness.internals.rowSummary.active.value).toBe(true)
  })

  it('gives its slot the state, the label and the toggle', async () => {
    harness = await mountLoaded({
      breakpoint: 'sm',
      render: () =>
        h(DataListViewToggle, null, {
          default: (scope: {
            active: boolean
            available: boolean
            label: string
            toggle: () => void
          }) =>
            h(
              'a',
              { class: 'custom', onClick: scope.toggle },
              `${scope.label}|${scope.active}|${scope.available}`,
            ),
        }),
      schema: createAccountsSchema({ summary: true }),
    })
    const link = () => harness?.wrapper.find('a.custom')
    expect(link()?.text()).toBe('Vue tableau|true|true')
    await link()?.trigger('click')
    await harness.flush()
    expect(link()?.text()).toBe('Vue liste|false|true')
  })
})

describe('view toggle in the toolbar', () => {
  it('replaces the footer for lists that have none', async () => {
    harness = await mountLoaded({
      breakpoint: 'sm',
      render: () => h(DataListDefault, { height: '400px' }),
      schema: createAuditSchema({ summary: true }),
    })
    const w = harness.wrapper
    expect(w.findAll('.nut-dl-view-toggle')).toHaveLength(1)
    expect(w.find('header .nut-dl-view-toggle').exists()).toBeTruthy()
    expect(w.find('footer').exists()).toBeFalsy()
  })

  it('stays in the footer of a paged list', async () => {
    harness = await mountLoaded({
      breakpoint: 'sm',
      render: () => h(DataListDefault, { height: '400px' }),
      schema: createAccountsSchema({ summary: true }),
    })
    const w = harness.wrapper
    expect(w.findAll('.nut-dl-view-toggle')).toHaveLength(1)
    expect(w.find('footer .nut-dl-view-toggle').exists()).toBeTruthy()
    expect(w.find('header .nut-dl-view-toggle').exists()).toBeFalsy()
  })
})

/** What the content shows after each of a few ticks: the summary rows, the table, or both. */
async function watchSwap(mounted: Harness) {
  const shown: string[] = []
  for (let tick = 0; tick < 12; tick += 1) {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 10))
    shown.push(
      [
        mounted.wrapper.find('.nut-dl-summary').exists() ? 'summary' : '',
        mounted.wrapper.find('.nut-dl-table').exists() ? 'table' : '',
      ].join('+'),
    )
  }
  return shown
}

describe('switching views inside the content transition', () => {
  it('comes in as the table and back as summary rows, never showing both', async () => {
    harness = await mountLoaded({
      breakpoint: 'sm',
      render: () => h(DataListContent),
      schema: createAccountsSchema({ summary: true }),
    })
    expect(harness.wrapper.find('.nut-dl-summary').exists()).toBeTruthy()

    harness.internals.rowSummary.setActive(false)
    const toTable = await watchSwap(harness)
    expect(toTable.at(-1)).toBe('+table')
    expect(toTable).not.toContain('summary+table')
    expect(harness.wrapper.find('.nut-dl-table').classes().join(' ')).not.toContain('-enter-')

    harness.internals.rowSummary.setActive(true)
    const toSummary = await watchSwap(harness)
    expect(toSummary.at(-1)).toBe('summary+')
    expect(toSummary).not.toContain('summary+table')
    expect(harness.wrapper.find('.nut-dl-summary').classes().join(' ')).not.toContain('-enter-')
  })
})

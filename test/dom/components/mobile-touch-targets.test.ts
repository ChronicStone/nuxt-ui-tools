import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import type { Component } from 'vue'

import DataListColumnPanel from '#ui-tools/table/components/data-list/data-list-column-panel.vue'
import DataListContent from '#ui-tools/table/components/data-list/data-list-content.vue'
import DataListErrorState from '#ui-tools/table/components/data-list/data-list-error-state.vue'
import DataListFilterPanel from '#ui-tools/table/components/data-list/data-list-filter-panel.vue'
import DataListFilterTags from '#ui-tools/table/components/data-list/data-list-filter-tags.vue'
import DataListInfiniteLoader from '#ui-tools/table/components/data-list/data-list-infinite-loader.vue'
import DataListLayoutSwitch from '#ui-tools/table/components/data-list/data-list-layout-switch.vue'
import DataListPagination from '#ui-tools/table/components/data-list/data-list-pagination.vue'
import DataListRefresh from '#ui-tools/table/components/data-list/data-list-refresh.vue'
import DataListSearch from '#ui-tools/table/components/data-list/data-list-search.vue'
import DataListSelectionActions from '#ui-tools/table/components/data-list/data-list-selection-actions.vue'
import DataListSortMenu from '#ui-tools/table/components/data-list/data-list-sort-menu.vue'
import DataListViewToggle from '#ui-tools/table/components/data-list/data-list-view-toggle.vue'
import SummaryRenderer from '#ui-tools/table/components/summary/summary-renderer.vue'
import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { createAccountsSchema, createAuditSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness, MountOptions } from '../harness'
import type { BreakpointKey } from '../nuxt-state'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const TOUCH = ['min-h-11', 'min-w-11']

interface TouchTarget {
  name: string
  /** The classes a thumb-sized control carries. */
  classes: string[]
  selector: string
  mount: (breakpoint: BreakpointKey) => Promise<Harness>
  /** Prepares what the control only shows in a state, such as a selection. */
  prepare?: (mounted: Harness) => Promise<void>
}

function mountPart(
  part: Component,
  breakpoint: BreakpointKey,
  props: Record<string, boolean | string | string[]> = {},
  options: Partial<MountOptions> = {},
) {
  return mountLoaded({
    schema: createAccountsSchema(),
    ...options,
    breakpoint,
    render: () => h(part, props),
  })
}

async function select(mounted: Harness) {
  mounted.internals.selection.selectRows({ rowIds: ['acc-1'] })
  await mounted.flush()
}

const TARGETS: TouchTarget[] = [
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(DataListRefresh, breakpoint),
    name: 'refresh',
    selector: '.nut-dl-refresh',
  },
  {
    classes: ['min-h-11'],
    mount: (breakpoint) => mountPart(DataListSearch, breakpoint),
    name: 'search field',
    selector: 'input.nut-dl-search',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(DataListSearch, breakpoint),
    name: 'search clear',
    prepare: async (mounted) => {
      mounted.internals.filters.searchQuery.value = 'Compte'
      await mounted.flush()
    },
    selector: '.nut-dl-search__clear',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(DataListLayoutSwitch, breakpoint, { mobile: true }),
    name: 'layout switch',
    selector: '.nut-dl-layout__btn',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(DataListColumnPanel, breakpoint, { mobile: true }),
    name: 'column panel',
    selector: '.nut-dl-colbtn',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) =>
      mountPart(
        DataListFilterPanel,
        breakpoint,
        {},
        { schema: createAccountsSchema({ panelFilters: true }) },
      ),
    name: 'filter panel',
    selector: '.nut-dl-fpanel-trigger',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(DataListFilterTags, breakpoint, { mobile: 'sheet' }),
    name: 'filter sheet',
    selector: '.nut-dl-sheet-trigger',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(DataListSortMenu, breakpoint, { layouts: ['table', 'grid'] }),
    name: 'sort menu',
    selector: '.nut-dl-sortbtn',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) =>
      mountPart(
        DataListViewToggle,
        breakpoint,
        {},
        { schema: createAccountsSchema({ summary: { enabled: true } }) },
      ),
    name: 'view toggle',
    selector: '.nut-dl-view-toggle',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(DataListPagination, breakpoint),
    name: 'pager',
    selector: '.nut-dl-pager__btn',
  },
  {
    classes: ['h-11'],
    mount: (breakpoint) => mountPart(DataListSelectionActions, breakpoint),
    name: 'selection actions button',
    prepare: select,
    selector: '.nut-dl-selbar__trigger',
  },
  {
    classes: ['size-11'],
    mount: (breakpoint) => mountPart(DataListSelectionActions, breakpoint),
    name: 'selection dismiss',
    prepare: select,
    selector: '.nut-dl-selbar__dismiss',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) =>
      mountLoaded({
        breakpoint,
        render: () =>
          h(DataListContent, null, {
            after: () => h(DataListInfiniteLoader, { auto: false }),
            content: () => h('div'),
          }),
        schema: createAuditSchema(),
      }),
    name: 'load more',
    selector: '[data-data-list-infinite-loader] [data-ui="UButton"]',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(DataListErrorState, breakpoint),
    name: 'retry',
    selector: '.nut-dl-error__actions [data-ui="UButton"]',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) => mountPart(TableRenderer, breakpoint, { height: '400px' }),
    name: 'row actions in the table',
    selector: '.nut-dl-rowbtn',
  },
  {
    classes: ['relative', 'before:absolute', 'before:size-11'],
    mount: (breakpoint) => mountPart(TableRenderer, breakpoint, { height: '400px' }),
    name: 'selection checkbox in the table',
    selector: '.nut-dl-select',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) =>
      mountPart(
        TableRenderer,
        breakpoint,
        { height: '400px' },
        {
          schema: createAccountsSchema({
            empty: { action: { label: 'Créer un compte' } },
            rows: [],
          }),
        },
      ),
    name: 'first-use action',
    selector: '.nut-dl-empty__action',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) =>
      mountPart(
        TableRenderer,
        breakpoint,
        { height: '400px' },
        { schema: createAccountsSchema({ rows: [] }) },
      ),
    name: 'filter reset',
    prepare: async (mounted) => {
      mounted.internals.filters.searchQuery.value = 'zzz'
      await mounted.flush()
    },
    selector: '.nut-dl-empty__action',
  },
  {
    classes: TOUCH,
    mount: (breakpoint) =>
      mountPart(
        SummaryRenderer,
        breakpoint,
        { height: '400px' },
        { schema: createAccountsSchema({ summary: { enabled: true } }) },
      ),
    name: 'row actions in summary rows',
    selector: '.nut-dl-rowbtn',
  },
]

describe('touch targets on mobile', () => {
  it.each(TARGETS)('gives the $name a 44px target below md', async (target) => {
    harness = await target.mount('sm')
    await target.prepare?.(harness)
    const control = harness.wrapper.find(target.selector)
    expect(control.exists()).toBeTruthy()
    expect(control.classes()).toStrictEqual(expect.arrayContaining(target.classes))
  })

  it.each(TARGETS)('leaves the $name at its desktop size from md up', async (target) => {
    harness = await target.mount('xl')
    await target.prepare?.(harness)
    const control = harness.wrapper.find(target.selector)
    if (!control.exists()) return
    for (const touchClass of target.classes) expect(control.classes()).not.toContain(touchClass)
  })
})

const refreshClasses = () => harness?.wrapper.find('.nut-dl-refresh').classes()

describe('mobile configuration layers', () => {
  it('keeps the app classes of a slot next to the touch target', async () => {
    harness = await mountPart(
      DataListRefresh,
      'sm',
      {},
      { ui: { refresh: { ui: { base: 'app-x' } } } },
    )
    expect(refreshClasses()).toStrictEqual(expect.arrayContaining(['app-x', ...TOUCH]))
    harness.unmount()

    harness = await mountPart(
      DataListRefresh,
      'sm',
      {},
      { ui: { mobile: { refresh: { ui: { base: 'tall-x' } } } } },
    )
    expect(refreshClasses()).toStrictEqual(expect.arrayContaining(['tall-x', ...TOUCH]))
  })

  it('lets the app shrink a control with conflicting utilities', async () => {
    harness = await mountPart(
      DataListRefresh,
      'sm',
      {},
      { ui: { mobile: { refresh: { ui: { base: 'min-h-0 min-w-0' } } } } },
    )
    expect(refreshClasses()).toStrictEqual(expect.arrayContaining(['min-h-0', 'min-w-0']))
    expect(refreshClasses()).not.toContain('min-h-11')
    expect(refreshClasses()).not.toContain('min-w-11')
  })

  it('does not touch what the app configured on other parts', async () => {
    harness = await mountPart(
      DataListViewToggle,
      'sm',
      {},
      {
        schema: createAccountsSchema({ summary: true }),
        ui: { mobile: { refresh: { ui: { base: 'min-h-0' } } } },
      },
    )
    expect(harness.wrapper.find('.nut-dl-view-toggle').classes()).toStrictEqual(
      expect.arrayContaining(TOUCH),
    )
  })

  it('applies none of it from md up, whatever the app sets under `mobile`', async () => {
    harness = await mountPart(
      DataListRefresh,
      'xl',
      {},
      { ui: { mobile: { refresh: { ui: { base: 'tall-x' } } } } },
    )
    expect(refreshClasses()).not.toContain('tall-x')
    expect(refreshClasses()).not.toContain('min-h-11')
  })

  it('sizes the sort sheet order buttons for a thumb', async () => {
    harness = await mountPart(DataListSortMenu, 'sm', { layouts: ['table', 'grid'] })
    await harness.wrapper.find('.nut-dl-sortbtn--sheet').trigger('click')
    await harness.flush()
    const order = harness.wrapper.findAll('.nut-dl-sort__dir button')
    expect(order).toHaveLength(2)
    for (const button of order) expect(button.classes()).toContain('h-11')
  })
})

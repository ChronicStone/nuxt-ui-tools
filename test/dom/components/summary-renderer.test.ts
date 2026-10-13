import { useCookie } from 'nuxt/app'
import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListTable from '#ui-tools/table/components/data-list/data-list-table.vue'

import { must } from '../../helpers/must'
import {
  asAccount,
  createAccounts,
  createAccountsSchema,
  createAuditSchema,
} from '../fixtures/accounts'
import { mountDataList, mountLoaded, texts } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

type MountOptions = Parameters<typeof mountLoaded>[0]

/** Mounts the table layout part, where summary rows take the table's place. */
function mountSummary(options: Omit<MountOptions, 'render'> & { tableProps?: object }) {
  return mountLoaded({
    breakpoint: 'sm',
    ...options,
    render: () => h(DataListTable, { height: '600px', ...options.tableProps }),
  })
}

function rowsOf(mounted: Harness) {
  return mounted.wrapper.findAll('li.nut-dl-summary__row')
}

describe('summary rows presentation', () => {
  it('reads each record as a row: leading tile, title, status and details', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ summary: true }) })
    const w = harness.wrapper
    expect(w.find('.nut-dl-summary').exists()).toBeTruthy()
    expect(w.find('.nut-dl-table').exists()).toBeFalsy()
    expect(w.find('ul.nut-dl-summary__list').attributes('role')).toBe('list')

    const rows = rowsOf(harness)
    const first = must(rows[0])
    expect(rows).toHaveLength(20)
    expect([
      first.attributes('data-row-id'),
      first.attributes('data-index'),
      first.find('.nut-dl-summary__title').text(),
      first.find('.nut-dl-summary__title').attributes('title'),
      first.find('.nut-dl-summary__leading').text(),
      first.find('.nut-dl-summary__status .pill').text(),
      first.find('.nut-dl-summary__details').text(),
    ]).toStrictEqual(['acc-1', '0', 'Compte 001', 'Compte 001', '01', 'Actif', 'FR · Entité 1'])
    expect(texts(w, '.nut-dl-summary__title').slice(0, 3)).toStrictEqual([
      'Compte 001',
      'Compte 002',
      'Compte 003',
    ])
    expect(w.find('thead').exists()).toBeFalsy()
  })

  it('sits rows on the default surface with a hairline, not on the page tint', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ summary: true }) })
    const root = harness.wrapper.find('.nut-dl-summary')
    const row = must(rowsOf(harness)[0])
    expect(root.classes()).toContain('bg-default')
    expect(row.classes()).toStrictEqual(
      expect.arrayContaining(['bg-default', 'border-b', 'border-muted']),
    )
    expect(row.find('.nut-dl-summary__title').classes()).toStrictEqual(
      expect.arrayContaining(['truncate', 'font-semibold']),
    )
    expect(row.find('.nut-dl-summary__leading').classes()).toContain('rounded-lg')
  })

  it('exposes size tokens as CSS variables', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ summary: true }) })
    function token(name: string) {
      const root = must(harness).wrapper.find('.nut-dl-summary').element
      return getComputedStyle(root).getPropertyValue(name)
    }
    expect([
      token('--nut-dl-summary-row-h'),
      token('--nut-dl-summary-tile'),
      token('--nut-dl-summary-font'),
      token('--nut-dl-summary-x'),
    ]).toStrictEqual(['64px', '32px', '13.5px', '14px'])
    harness.unmount()

    harness = await mountSummary({
      schema: createAccountsSchema({ summary: true }),
      ui: { summary: { size: 'lg' }, table: { gutter: 20 } },
    })
    expect([token('--nut-dl-summary-row-h'), token('--nut-dl-summary-x')]).toStrictEqual([
      '72px',
      '20px',
    ])
  })

  it('skips empty detail values and leaves no stray separator', async () => {
    const schema = createAccountsSchema({ summary: true })
    const summary = must(schema.table?.summary)
    summary.details = ({ row }) => [undefined, asAccount(row).country, null, '', false, 0]
    harness = await mountSummary({ schema })
    expect(must(rowsOf(harness)[0]).find('.nut-dl-summary__details').text()).toBe('FR · 0')
  })

  it('omits the meta line, the tile and the status a record has nothing for', async () => {
    const schema = createAccountsSchema({ summary: true })
    const summary = must(schema.table?.summary)
    summary.leading = undefined
    summary.status = undefined
    summary.details = () => []
    harness = await mountSummary({ schema })
    const first = must(rowsOf(harness)[0])
    expect([
      first.find('.nut-dl-summary__leading').exists(),
      first.find('.nut-dl-summary__meta').exists(),
      first.find('.nut-dl-summary__title').text(),
    ]).toStrictEqual([false, false, 'Compte 001'])
  })

  it('merges ui slots over the defaults', async () => {
    harness = await mountSummary({
      schema: createAccountsSchema({ summary: true }),
      ui: {
        summary: {
          ui: {
            root: 'root-x',
            row: 'row-x bg-elevated',
            title: 'title-x',
          },
        },
      },
    })
    const row = must(rowsOf(harness)[0])
    expect(harness.wrapper.find('.nut-dl-summary').classes()).toContain('root-x')
    expect(row.classes()).toContain('row-x')
    expect(row.classes()).toContain('bg-elevated')
    expect(row.classes()).not.toContain('bg-default')
    expect(row.find('.nut-dl-summary__title').classes()).toContain('title-x')
  })
})

describe('summary rows availability', () => {
  it('replaces the table below md and keeps it from md up', async () => {
    harness = await mountSummary({
      breakpoint: 'xl',
      schema: createAccountsSchema({ summary: true }),
    })
    expect(harness.wrapper.find('.nut-dl-table').exists()).toBeTruthy()
    expect(harness.wrapper.find('.nut-dl-summary').exists()).toBeFalsy()
    harness.unmount()

    harness = await mountSummary({
      breakpoint: 'md',
      schema: createAccountsSchema({ summary: true }),
    })
    expect(harness.wrapper.find('.nut-dl-table').exists()).toBeTruthy()
    harness.unmount()

    harness = await mountSummary({
      breakpoint: 'xs',
      schema: createAccountsSchema({ summary: true }),
    })
    expect(harness.wrapper.find('.nut-dl-summary').exists()).toBeTruthy()
    expect(harness.internals.rowSummary.active.value).toBeTruthy()
  })

  it('stays off until the schema configures summary rows', async () => {
    harness = await mountSummary({ schema: createAccountsSchema() })
    expect(harness.wrapper.find('.nut-dl-table').exists()).toBeTruthy()
    expect([
      harness.internals.rowSummary.available.value,
      harness.internals.rowSummary.active.value,
    ]).toStrictEqual([false, false])
  })

  it('follows a responsive or boolean `enabled`', async () => {
    harness = await mountSummary({
      breakpoint: 'md',
      schema: createAccountsSchema({ summary: { enabled: 'true lg:false' } }),
    })
    expect(harness.wrapper.find('.nut-dl-summary').exists()).toBeTruthy()
    harness.unmount()

    harness = await mountSummary({
      breakpoint: 'xl',
      schema: createAccountsSchema({ summary: { enabled: true } }),
    })
    expect(harness.wrapper.find('.nut-dl-summary').exists()).toBeTruthy()
    harness.unmount()

    harness = await mountSummary({
      schema: createAccountsSchema({ summary: { enabled: false } }),
    })
    expect(harness.wrapper.find('.nut-dl-table').exists()).toBeTruthy()
  })

  it('gives way to the grid layout and to a disabled table layout', async () => {
    harness = await mountSummary({
      query: { l: 'grid' },
      schema: createAccountsSchema({ summary: true }),
    })
    expect(harness.internals.rowSummary.available.value).toBeFalsy()
    harness.unmount()

    harness = await mountSummary({
      schema: createAccountsSchema({ grid: true, summary: true, tableEnabled: false }),
    })
    expect(harness.internals.rowSummary.available.value).toBeFalsy()
  })
})

describe('summary rows toggle', () => {
  it('switches to the table and back, remembering the reader choice', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ summary: true }) })
    const w = harness.wrapper
    const stored = useCookie<string | null>('accounts::view')
    expect(stored.value).toBeNull()

    harness.internals.rowSummary.setActive(false)
    await harness.flush()
    expect(w.find('.nut-dl-table').exists()).toBeTruthy()
    expect(w.find('.nut-dl-summary').exists()).toBeFalsy()
    expect([
      stored.value,
      harness.internals.rowSummary.available.value,
      harness.internals.rowSummary.active.value,
    ]).toStrictEqual(['table', true, false])

    harness.internals.rowSummary.setActive(true)
    await harness.flush()
    expect(w.find('.nut-dl-summary').exists()).toBeTruthy()
    expect(stored.value).toBeNull()
  })

  it('keeps the choice for the session only when preferences are not persisted', async () => {
    harness = await mountSummary({
      schema: { ...createAccountsSchema({ summary: true }), persistence: { preferences: false } },
    })
    harness.internals.rowSummary.setActive(false)
    await harness.flush()
    expect(harness.wrapper.find('.nut-dl-table').exists()).toBeTruthy()
    expect(useCookie<string | null>('accounts::view').value).toBeNull()
  })

  it('stores the choice under a valid cookie name for a free-form table key', async () => {
    harness = await mountSummary({
      schema: { ...createAccountsSchema({ summary: true }), tableKey: 'Comptes clients' },
    })
    harness.internals.rowSummary.setActive(false)
    await harness.flush()
    expect(useCookie<string | null>('Comptes%20clients::view').value).toBe('table')
  })

  it('is reachable through the table api', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ summary: true }) })
    const { summary } = harness.table
    expect(summary.state.value).toStrictEqual({ active: true, available: true })
    summary.set(false)
    await harness.flush()
    expect(summary.state.value).toStrictEqual({ active: false, available: true })
  })

  it('offers no toggle where summary rows are not available', async () => {
    harness = await mountSummary({
      breakpoint: 'xl',
      schema: createAccountsSchema({ summary: { enabled: false } }),
    })
    expect(harness.internals.controls.headerControls.value.summary).toBeFalsy()
    expect(harness.table.summary.state.value).toStrictEqual({ active: false, available: false })
    harness.table.summary.set(true)
    await harness.flush()
    expect(harness.wrapper.find('.nut-dl-table').exists()).toBeTruthy()
  })
})

describe('summary rows interaction', () => {
  it('links the row to its record', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ summary: { to: true } }) })
    const main = must(rowsOf(harness)[0]).find('.nut-dl-summary__main')
    expect([main.element.tagName, main.attributes('href')]).toStrictEqual(['A', '/accounts/acc-1'])
    expect(must(rowsOf(harness)[0]).attributes('data-interactive')).toBe('true')
  })

  it('runs `onSelect` when the row is tapped', async () => {
    const tapped: string[] = []
    harness = await mountSummary({
      schema: createAccountsSchema({ summary: { onSelect: (row) => tapped.push(row.id) } }),
    })
    const main = must(rowsOf(harness)[1]).find('.nut-dl-summary__main')
    expect(main.element.tagName).toBe('BUTTON')
    await main.trigger('click')
    expect(tapped).toStrictEqual(['acc-2'])
  })

  it('renders a plain block when the row goes nowhere', async () => {
    harness = await mountSummary({ schema: createAccountsSummarySchemaWithoutTarget() })
    const row = must(rowsOf(harness)[0])
    expect([
      row.find('.nut-dl-summary__main').element.tagName,
      row.attributes('data-interactive'),
    ]).toStrictEqual(['DIV', 'false'])
  })

  it('draws row actions with a 44px target on mobile, named for the record', async () => {
    harness = await mountSummary({
      schema: createAccountsSchema({ rowLabel: true, summary: true }),
    })
    const first = must(rowsOf(harness)[0])
    const button = first.find('.nut-dl-summary__actions [data-ui="UButton"]')
    expect([
      button.attributes('aria-label'),
      button.classes().includes('min-h-11'),
      button.classes().includes('min-w-11'),
    ]).toStrictEqual(['Actions pour Compte 001', true, true])
  })

  it('draws no actions cell when no row has an action', async () => {
    harness = await mountSummary({
      schema: createAccountsSchema({ rowActions: false, summary: true }),
    })
    expect(harness.wrapper.find('.nut-dl-summary__actions').exists()).toBeFalsy()
  })
})

describe('summary rows selection', () => {
  it('selects a record from its own checkbox, named for it', async () => {
    harness = await mountSummary({
      schema: createAccountsSchema({ rowLabel: true, summary: true }),
    })
    const first = must(rowsOf(harness)[0])
    const check = first.find('input[type="checkbox"]')
    expect(check.attributes('aria-label')).toBe('Sélectionner Compte 001')
    expect(first.find('.nut-dl-summary__select > span').classes()).toStrictEqual(
      expect.arrayContaining(['min-h-11', 'min-w-11']),
    )
    await check.trigger('click')
    await harness.flush()
    expect([
      harness.internals.selection.selectedCount.value,
      must(rowsOf(harness)[0]).attributes('data-selected'),
      must(rowsOf(harness)[1]).attributes('data-selected'),
    ]).toStrictEqual([1, 'true', 'false'])
  })

  it('names a record by its position when the schema gives no label', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ summary: true }) })
    const second = must(rowsOf(harness)[1])
    expect(second.find('input[type="checkbox"]').attributes('aria-label')).toBe(
      'Sélectionner la ligne 2',
    )
    expect(
      second.find('.nut-dl-summary__actions [data-ui="UButton"]').attributes('aria-label'),
    ).toBe('Actions pour la ligne 2')
  })

  it('selects every record from the strip above the rows', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ summary: true }) })
    const strip = harness.wrapper.find('.nut-dl-summary__header')
    expect(strip.text()).toBe('Sélectionner toutes les lignes')
    expect(strip.find('input[type="checkbox"]').attributes('aria-label')).toBe(
      'Sélectionner toutes les lignes',
    )
    await strip.find('input[type="checkbox"]').trigger('click')
    await harness.flush()
    expect(harness.internals.selection.selectedCount.value).toBe(60)
    expect(harness.wrapper.findAll('li.nut-dl-summary__row[data-selected="true"]')).toHaveLength(20)
    await strip.find('input[type="checkbox"]').trigger('click')
    await harness.flush()
    expect(harness.internals.selection.selectedCount.value).toBe(0)
  })

  it('has no checkboxes or strip when the list cannot select', async () => {
    harness = await mountSummary({
      schema: createAccountsSchema({ actions: false, rowActions: false, summary: true }),
    })
    expect(harness.wrapper.find('.nut-dl-summary__header').exists()).toBeFalsy()
    expect(harness.wrapper.find('.nut-dl-summary__select').exists()).toBeFalsy()
  })
})

describe('summary rows states', () => {
  it('shows placeholder rows while the first page loads', async () => {
    harness = await mountDataList({
      breakpoint: 'sm',
      render: () => h(DataListTable, { height: '600px' }),
      schema: createAccountsSchema({ gate: new Promise(() => {}), summary: true }),
      settle: false,
    })
    await harness.flush(1)
    const root = harness.wrapper.find('.nut-dl-summary')
    expect(root.attributes('data-loading')).toBe('true')
    expect(harness.wrapper.findAll('li.nut-dl-summary__skeleton').length).toBeGreaterThanOrEqual(6)
    expect(harness.wrapper.find('li.nut-dl-summary__skeleton').attributes('aria-hidden')).toBe(
      'true',
    )
    expect(rowsOf(harness)).toHaveLength(0)
    expect(harness.wrapper.find('.nut-dl-summary__header').exists()).toBeFalsy()
  })

  it('shows the empty state with its reset when filters hide every record', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ rows: [], summary: true }) })
    expect(harness.wrapper.find('.nut-dl-summary .nut-dl-empty').exists()).toBeTruthy()
    expect(rowsOf(harness)).toHaveLength(0)
  })

  it('shows the error state with a retry', async () => {
    harness = await mountDataList({
      breakpoint: 'sm',
      render: () => h(DataListTable, { height: '600px' }),
      schema: createAccountsSchema({ fail: true, summary: true }),
    })
    await harness.until(() => must(harness).wrapper.find('.nut-dl-error').exists(), 4000)
    expect(harness.wrapper.find('.nut-dl-summary .nut-dl-error').attributes('role')).toBe('alert')
    expect(rowsOf(harness)).toHaveLength(0)
  })

  it('forwards the empty slot', async () => {
    harness = await mountLoaded({
      breakpoint: 'sm',
      render: () =>
        h(
          DataListTable,
          { height: '600px' },
          { empty: () => h('p', { class: 'custom-empty' }, 'Rien ici') },
        ),
      schema: createAccountsSchema({ rows: [], summary: true }),
    })
    expect(harness.wrapper.find('.custom-empty').text()).toBe('Rien ici')
    expect(harness.wrapper.find('.nut-dl-empty').exists()).toBeFalsy()
  })

  it('shows the progress line and dims rows while they are replaced', async () => {
    harness = await mountSummary({ schema: createAccountsSchema({ delay: 80, summary: true }) })
    const progress = harness.wrapper.find('.nut-dl-progress')
    expect(progress.attributes('data-active')).toBe('false')
    const refresh = harness.internals.queryContent.refreshData()()
    await harness.until(() => progress.attributes('data-active') === 'true')
    expect(rowsOf(harness).length).toBeGreaterThan(0)
    await refresh
  })

  it('shows a loading row while a cursor list fetches its next page', async () => {
    harness = await mountSummary({
      schema: createAuditSchema({ delay: 60, pageSize: 20, summary: true, total: 45 }),
    })
    await harness.until(() => must(harness).wrapper.find('.nut-dl-summary__more').exists())
    expect(harness.wrapper.find('.nut-dl-summary__more').text()).toBe('Chargement…')
    await harness.until(() => must(harness).internals.pagination.loadedCount.value === 45, 4000)
    await harness.until(() => !must(harness).wrapper.find('.nut-dl-summary__more').exists())
    expect(harness.wrapper.find('.nut-dl-summary').attributes('data-virtualized')).toBe('true')
  })
})

describe('summary rows on long pages', () => {
  it('virtualizes from 40 rows', async () => {
    harness = await mountSummary({
      query: { 'p.size': '50' },
      schema: createAccountsSchema({ rows: createAccounts(120), summary: true }),
    })
    expect(harness.wrapper.find('.nut-dl-summary').attributes('data-virtualized')).toBe('true')
    expect(rowsOf(harness).length).toBeLessThanOrEqual(50)
  })
})

function createAccountsSummarySchemaWithoutTarget() {
  const schema = createAccountsSchema({ summary: true })
  const summary = must(schema.table?.summary)
  summary.to = undefined
  summary.onSelect = undefined
  return schema
}

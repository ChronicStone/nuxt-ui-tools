import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import { defineTableSchema, tableSource } from '#ui-tools/table'
import GridRenderer from '#ui-tools/table/components/grid/grid-renderer.vue'
import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'
import type { TableGroupBySchema } from '#ui-tools/table/types'
import { tableGroupsStorageKey } from '#ui-tools/table/utils/groups'

import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())
beforeEach(() => window.localStorage.clear())

const TABLE_KEY = 'groups-test'

interface Exam {
  id: string
  name: string
  family: string | null
  price: number
}

const exams: Exam[] = [
  { family: 'General', id: 'g1', name: 'Listening', price: 30 },
  { family: 'Business', id: 'b1', name: 'Speaking', price: 20 },
  { family: 'General', id: 'g2', name: 'Reading', price: 10 },
  { family: null, id: 'x1', name: 'Legacy', price: 40 },
  { family: 'Business', id: 'b2', name: 'Writing', price: 50 },
]

function schema(
  options: { groupBy?: TableGroupBySchema<Exam>; tree?: boolean; grid?: boolean } = {},
) {
  const groupBy: TableGroupBySchema<Exam> = options.groupBy ?? { key: 'family' }
  return defineTableSchema({
    actions: [{ key: 'export', label: 'Export', requiresSelection: true, action: () => undefined }],
    grid: {
      enabled: options.grid,
      groupBy,
      renderItem: ({ row }) => h('article', { class: 'exam-card' }, String(row.name)),
    },
    defaultLayout: options.grid ? 'grid' : 'table',
    pagination: false,
    rowKey: 'id',
    selection: { mode: true },
    source: tableSource({
      mode: 'client',
      query: () => ({ queryFn: () => exams, queryKey: [TABLE_KEY] }),
    }),
    table: {
      columns: (column) => [
        column.field('name', { label: 'Name', render: ({ row }) => String(row.name) }),
        column.field('price', { label: 'Price', sortable: true }),
      ],
      groupBy,
      tree: options.tree ? { children: 'children' } : undefined,
    },
    tableKey: TABLE_KEY,
  })
}

async function mountTable(options: Parameters<typeof schema>[0] = {}) {
  harness = await mountLoaded({
    render: () => h(TableRenderer, { height: '600px' }),
    schema: schema(options),
  })
  await harness.until(() => harness!.wrapper.find('.nut-dl-row').exists())
  return harness
}

function body(mounted: Harness) {
  return mounted.wrapper.findAll('tbody tr.nut-dl-row').map((row) => {
    const label = row.find('.nut-dl-group__label')
    return label.exists() ? `# ${label.text()}` : row.attributes('data-row-id')
  })
}

function header(mounted: Harness, position: number) {
  const headers = mounted.wrapper.findAll('.nut-dl-group')
  const found = headers[position]
  if (!found) throw new Error(`no group header at ${position}`)
  return found
}

describe('TableRenderer row groups', () => {
  it('lists each group under its header, with the count and a label for rows with no value', async () => {
    const mounted = await mountTable()

    expect(body(mounted)).toEqual([
      '# Business',
      'b1',
      'b2',
      '# General',
      'g1',
      'g2',
      '# Autres',
      'x1',
    ])
    expect(mounted.wrapper.findAll('.nut-dl-group__summary').map((node) => node.text())).toEqual([
      '2',
      '2',
      '1',
    ])
  })

  it('spans the whole width with the header row', async () => {
    const mounted = await mountTable()
    const cell = mounted.wrapper.find('.nut-dl-group-cell')
    const columns = mounted.wrapper.findAll('colgroup col').length

    expect(cell.attributes('colspan')).toBe(String(columns))
  })

  it('folds from the header and from the chevron, and keeps the header', async () => {
    const mounted = await mountTable()

    await header(mounted, 0).trigger('click')
    await mounted.until(() => !body(mounted).includes('b1'))
    expect(body(mounted).slice(0, 2)).toEqual(['# Business', '# General'])
    expect(header(mounted, 0).find('button').attributes('aria-expanded')).toBe('false')

    await header(mounted, 0).find('button').trigger('click')
    await mounted.until(() => body(mounted).includes('b1'))
    expect(header(mounted, 0).find('button').attributes('aria-expanded')).toBe('true')
  })

  it('does not read as empty when every group is folded', async () => {
    harness = await mountLoaded({
      render: () => h(TableRenderer, { height: '600px' }),
      schema: schema({ groupBy: { collapsed: true, key: 'family' } }),
    })
    await harness.until(() => harness!.wrapper.find('.nut-dl-group').exists())

    expect(body(harness)).toEqual(['# Business', '# General', '# Autres'])
    expect(harness.wrapper.find('.nut-dl-empty').exists()).toBe(false)
  })

  it('opens from a collapsed schema and remembers what the reader toggled', async () => {
    window.localStorage.setItem(
      tableGroupsStorageKey(TABLE_KEY),
      JSON.stringify(['group:"General"']),
    )
    const mounted = await mountTable()
    await mounted.until(() => !body(mounted).includes('g1'))

    expect(body(mounted)).toEqual(['# Business', 'b1', 'b2', '# General', '# Autres', 'x1'])

    await header(mounted, 0).trigger('click')
    await mounted.until(() => !body(mounted).includes('b1'))
    expect(
      JSON.parse(window.localStorage.getItem(tableGroupsStorageKey(TABLE_KEY)) ?? '[]'),
    ).toEqual(['group:"General"', 'group:"Business"'])
  })

  it('selects a whole group from its checkbox, reads mixed when only some rows are selected', async () => {
    const mounted = await mountTable()
    const { selection } = mounted.internals

    await header(mounted, 0).find('.nut-dl-select').trigger('click')
    await mounted.flush(1)
    expect(selection.selectedKeys.value).toEqual(['b1', 'b2'])
    expect(body(mounted)).toContain('b1')

    selection.unselectRows({ rowIds: ['b1'] })
    await mounted.flush(1)
    expect(selection.getRowsSelectionState({ rowIds: ['b1', 'b2'] })).toBe('indeterminate')

    await header(mounted, 0).find('.nut-dl-select').trigger('click')
    expect(selection.selectedKeys.value).toEqual(['b2', 'b1'])

    await header(mounted, 0).find('.nut-dl-select').trigger('click')
    expect(selection.selectedKeys.value).toEqual([])
  })

  it('runs a shift range over the rows in the order they show, skipping folded groups', async () => {
    const mounted = await mountTable()
    const { selection } = mounted.internals

    await header(mounted, 1).trigger('click')
    await mounted.until(() => !body(mounted).includes('g1'))

    selection.toggleRowSelection({ rowId: 'b2', selected: true })
    selection.toggleRowSelection({ rowId: 'x1', selected: true, shiftKey: true })
    expect(selection.selectedKeys.value).toEqual(['b2', 'x1'])
  })

  it('sorts inside each group and leaves the groups where they are', async () => {
    const mounted = await mountTable()
    mounted.table.sorting.set({ dir: 'desc', key: 'price' })
    await mounted.until(() => body(mounted)[1] === 'b2')

    expect(body(mounted)).toEqual([
      '# Business',
      'b2',
      'b1',
      '# General',
      'g1',
      'g2',
      '# Autres',
      'x1',
    ])
  })

  it('is left out when the table is a tree', async () => {
    const mounted = await mountTable({ tree: true })

    expect(mounted.wrapper.find('.nut-dl-group').exists()).toBe(false)
    expect(mounted.internals.groups.enabled.value).toBe(false)
  })
})

describe('GridRenderer row groups', () => {
  async function mountGrid() {
    harness = await mountLoaded({
      render: () => h(GridRenderer, { height: '600px' }),
      schema: schema({ grid: true }),
    })
    await harness.until(() => harness!.wrapper.find('.exam-card').exists())
    return harness
  }

  it('puts a header before the cards of each group, without a checkbox', async () => {
    const mounted = await mountGrid()
    const items = mounted.wrapper.findAll('.nut-dl-group, .exam-card').map((node) => node.text())

    expect(items[0]).toContain('Business')
    expect(items.slice(1, 3)).toEqual(['Speaking', 'Writing'])
    expect(items[3]).toContain('General')
    expect(mounted.wrapper.find('.nut-dl-group .nut-dl-select').exists()).toBe(false)
  })

  it('folds the cards of a group and does not read as empty when all are folded', async () => {
    const mounted = await mountGrid()

    for (const position of [0, 1, 2]) {
      await header(mounted, position).trigger('click')
      await mounted.flush(1)
    }

    expect(mounted.wrapper.findAll('.exam-card')).toHaveLength(0)
    expect(mounted.wrapper.findAll('.nut-dl-group')).toHaveLength(3)
    expect(mounted.wrapper.find('.nut-dl-grid__state').exists()).toBe(false)
  })
})

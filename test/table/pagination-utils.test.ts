import { describe, expect, it } from 'vitest'

import type { TableSchemaView } from '#ui-tools/table/types'
import {
  getDefaultPageSize,
  getDefaultSort,
  getPageSizeOptions,
  getPaginationMode,
  getSortKeys,
} from '#ui-tools/table/utils/query-state'

const base = {
  rowKey: 'id',
  source: { mode: 'client', query: () => ({ queryKey: ['x'] }) },
  tableKey: 't',
} as unknown as TableSchemaView

describe('pagination helpers', () => {
  it('reads defaults per layout with schema overrides', () => {
    expect([
      getPaginationMode(base),
      getPaginationMode({ pagination: false }),
      getPaginationMode({ pagination: { mode: 'cursor' } }),
      getDefaultPageSize({ layout: 'table', schema: base }),
      getDefaultPageSize({ layout: 'grid', schema: base }),
    ]).toStrictEqual(['offset', 'none', 'cursor', 50, 10])
    const custom = {
      ...base,
      pagination: { defaultSize: { table: 25 }, sizeOptions: { table: [25, 75] } },
    } as unknown as TableSchemaView
    expect([
      getDefaultPageSize({ layout: 'table', schema: custom }),
      getDefaultPageSize({ layout: 'grid', schema: custom }),
      getPageSizeOptions({ layout: 'table', schema: custom }),
      getPageSizeOptions({ layout: 'grid', schema: custom }),
    ]).toStrictEqual([25, 10, [25, 75], [10, 20, 50, 100]])
    const flat = {
      ...base,
      pagination: { defaultSize: 30, sizeOptions: [30, 60] },
    } as unknown as TableSchemaView
    expect([
      getDefaultPageSize({ layout: 'grid', schema: flat }),
      getPageSizeOptions({ layout: 'grid', schema: flat }),
    ]).toStrictEqual([30, [30, 60]])
    const cursor = {
      ...base,
      pagination: { mode: 'cursor', pageSize: { grid: 8 } },
    } as unknown as TableSchemaView
    expect([
      getDefaultPageSize({ layout: 'grid', schema: cursor }),
      getDefaultPageSize({ layout: 'table', schema: cursor }),
      getPageSizeOptions({ layout: 'table', schema: cursor }),
    ]).toStrictEqual([8, 50, [10, 20, 50, 100, 200, 500]])
  })

  it('derives default sorts and sort keys per layout', () => {
    const schema = {
      ...base,
      grid: {
        defaultSorting: { dir: 'desc', key: 'updated' },
        sortOptions: [{ key: 'updated', label: 'U' }],
      },
      table: {
        columns: [
          { field: 'name', key: 'name', kind: 'field' },
          { field: 'age', key: 'age', kind: 'field', sortable: false },
          { key: 'c', kind: 'composite', sortableKey: 'created' },
        ],
        defaultSorting: 'name',
      },
    } as unknown as TableSchemaView
    expect(getDefaultSort({ layout: 'table', schema })).toStrictEqual({ dir: 'asc', key: 'name' })
    expect(getDefaultSort({ layout: 'grid', schema })).toStrictEqual({
      dir: 'desc',
      key: 'updated',
    })
    expect(getDefaultSort({ layout: 'table', schema: base })).toBeNull()
    expect(getSortKeys({ layout: 'table', schema })).toStrictEqual(['name', 'updated', 'created'])
    expect(getSortKeys({ layout: 'grid', schema })).toStrictEqual(['updated', 'name', 'created'])
  })
})

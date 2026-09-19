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
    expect(getPaginationMode(base)).toBe('offset')
    expect(getPaginationMode({ pagination: false })).toBe('none')
    expect(getPaginationMode({ pagination: { mode: 'cursor' } })).toBe('cursor')
    expect(getDefaultPageSize({ layout: 'table', schema: base })).toBe(50)
    expect(getDefaultPageSize({ layout: 'grid', schema: base })).toBe(10)
    const custom = {
      ...base,
      pagination: { defaultSize: { table: 25 }, sizeOptions: { table: [25, 75] } },
    } as unknown as TableSchemaView
    expect(getDefaultPageSize({ layout: 'table', schema: custom })).toBe(25)
    expect(getDefaultPageSize({ layout: 'grid', schema: custom })).toBe(10)
    expect(getPageSizeOptions({ layout: 'table', schema: custom })).toStrictEqual([25, 75])
    expect(getPageSizeOptions({ layout: 'grid', schema: custom })).toStrictEqual([10, 20, 50, 100])
    const flat = {
      ...base,
      pagination: { defaultSize: 30, sizeOptions: [30, 60] },
    } as unknown as TableSchemaView
    expect(getDefaultPageSize({ layout: 'grid', schema: flat })).toBe(30)
    expect(getPageSizeOptions({ layout: 'grid', schema: flat })).toStrictEqual([30, 60])
    const cursor = {
      ...base,
      pagination: { mode: 'cursor', pageSize: { grid: 8 } },
    } as unknown as TableSchemaView
    expect(getDefaultPageSize({ layout: 'grid', schema: cursor })).toBe(8)
    expect(getDefaultPageSize({ layout: 'table', schema: cursor })).toBe(50)
    expect(getPageSizeOptions({ layout: 'table', schema: cursor })).toStrictEqual([
      10, 20, 50, 100, 200, 500,
    ])
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

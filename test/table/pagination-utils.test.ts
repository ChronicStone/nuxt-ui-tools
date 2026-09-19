import { describe, expect, it } from 'vitest'

import type { TableSchemaView } from '#ui-tools/table/types'
import { getDefaultPageSize, getDefaultSort, getPageSizeOptions, getPaginationMode, getSortKeys } from '#ui-tools/table/utils/query-state'

const base = { tableKey: 't', rowKey: 'id', source: { mode: 'client', query: () => ({ queryKey: ['x'] }) } } as unknown as TableSchemaView

describe('pagination helpers', () => {
  it('reads defaults per layout with schema overrides', () => {
    expect(getPaginationMode(base)).toBe('offset')
    expect(getPaginationMode({ pagination: false })).toBe('none')
    expect(getPaginationMode({ pagination: { mode: 'cursor' } })).toBe('cursor')
    expect(getDefaultPageSize({ schema: base, layout: 'table' })).toBe(50)
    expect(getDefaultPageSize({ schema: base, layout: 'grid' })).toBe(10)
    const custom = { ...base, pagination: { defaultSize: { table: 25 }, sizeOptions: { table: [25, 75] } } } as unknown as TableSchemaView
    expect(getDefaultPageSize({ schema: custom, layout: 'table' })).toBe(25)
    expect(getDefaultPageSize({ schema: custom, layout: 'grid' })).toBe(10)
    expect(getPageSizeOptions({ schema: custom, layout: 'table' })).toEqual([25, 75])
    expect(getPageSizeOptions({ schema: custom, layout: 'grid' })).toEqual([10, 20, 50, 100])
    const flat = { ...base, pagination: { defaultSize: 30, sizeOptions: [30, 60] } } as unknown as TableSchemaView
    expect(getDefaultPageSize({ schema: flat, layout: 'grid' })).toBe(30)
    expect(getPageSizeOptions({ schema: flat, layout: 'grid' })).toEqual([30, 60])
    const cursor = { ...base, pagination: { mode: 'cursor', pageSize: { grid: 8 } } } as unknown as TableSchemaView
    expect(getDefaultPageSize({ schema: cursor, layout: 'grid' })).toBe(8)
    expect(getDefaultPageSize({ schema: cursor, layout: 'table' })).toBe(50)
    expect(getPageSizeOptions({ schema: cursor, layout: 'table' })).toEqual([10, 20, 50, 100, 200, 500])
  })

  it('derives default sorts and sort keys per layout', () => {
    const schema = {
      ...base,
      table: { defaultSorting: 'name', columns: [{ kind: 'field', key: 'name', field: 'name' }, { kind: 'field', key: 'age', field: 'age', sortable: false }, { kind: 'composite', key: 'c', sortableKey: 'created' }] },
      grid: { defaultSorting: { key: 'updated', dir: 'desc' }, sortOptions: [{ key: 'updated', label: 'U' }] },
    } as unknown as TableSchemaView
    expect(getDefaultSort({ schema, layout: 'table' })).toEqual({ key: 'name', dir: 'asc' })
    expect(getDefaultSort({ schema, layout: 'grid' })).toEqual({ key: 'updated', dir: 'desc' })
    expect(getDefaultSort({ schema: base, layout: 'table' })).toBeNull()
    expect(getSortKeys({ schema, layout: 'table' })).toEqual(['name', 'updated', 'created'])
    expect(getSortKeys({ schema, layout: 'grid' })).toEqual(['updated', 'name', 'created'])
  })
})

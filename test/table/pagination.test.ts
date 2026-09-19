import { describe, expect, it } from 'vitest'

import { defineTableSchema } from '#ui-tools/table/schema'
import { flattenTableCursorPages } from '#ui-tools/table/utils/pagination'
import { getPaginationMode } from '#ui-tools/table/utils/query-state'

describe('table pagination strategies', () => {
  it('resolves offset, cursor, and none from schema configuration', () => {
    const source = {
      query: () => ({ queryFn: async () => [{ id: 'row-1' }], queryKey: ['rows'] }),
    }
    const offset = defineTableSchema({ rowKey: 'id', source, tableKey: 'offset' })
    const cursor = defineTableSchema({
      pagination: { mode: 'cursor', pageSize: 24 },
      rowKey: 'id',
      source: {
        mode: 'remote',
        query: () => ({
          queryFn: async () => ({
            pageInfo: {
              count: 'none' as const,
              mode: 'cursor' as const,
              nextCursor: null,
              pageSize: 24,
              rowCount: null,
            },
            rows: [{ id: 'row-1' }],
          }),
          queryKey: ['cursor-rows'],
        }),
      },
      tableKey: 'cursor',
    })
    const none = defineTableSchema({
      pagination: false,
      rowKey: 'id',
      source,
      tableKey: 'none',
    })

    expect(getPaginationMode(offset)).toBe('offset')
    expect(getPaginationMode(cursor)).toBe('cursor')
    expect(getPaginationMode(none)).toBe('none')
  })

  it('flattens cursor pages, de-duplicates row keys, and preserves an exact total', () => {
    const result = flattenTableCursorPages({
      pages: [
        {
          pageInfo: {
            count: 'exact',
            mode: 'cursor',
            nextCursor: 'page-2',
            pageSize: 2,
            rowCount: 3,
          },
          rows: [
            { id: 'row-1', label: 'First' },
            { id: 'row-2', label: 'Old' },
          ],
        },
        {
          pageInfo: {
            count: 'exact',
            mode: 'cursor',
            nextCursor: null,
            pageSize: 2,
            rowCount: 3,
          },
          rows: [
            { id: 'row-2', label: 'Updated' },
            { id: 'row-3', label: 'Third' },
          ],
        },
      ],
      rowKey: 'id',
    })

    expect(result.rows).toStrictEqual([
      { id: 'row-1', label: 'First' },
      { id: 'row-2', label: 'Updated' },
      { id: 'row-3', label: 'Third' },
    ])
    expect(result.rowCount).toBe(3)
  })

  it('keeps total count unknown when cursor counting is disabled', () => {
    const result = flattenTableCursorPages({
      pages: [
        {
          pageInfo: {
            count: 'none',
            mode: 'cursor',
            nextCursor: null,
            pageSize: 1,
            rowCount: null,
          },
          rows: [{ id: 'row-1' }],
        },
      ],
      rowKey: 'id',
    })

    expect(result.rows).toHaveLength(1)
    expect(result.rowCount).toBeNull()
  })
})

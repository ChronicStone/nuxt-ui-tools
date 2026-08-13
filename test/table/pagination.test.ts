import { describe, expect, it } from 'vitest'

import { defineTableSchema } from '#ui-tools/table/schema'
import { flattenTableCursorPages } from '#ui-tools/table/utils/pagination'
import { getPaginationMode } from '#ui-tools/table/utils/query-state'

describe('table pagination strategies', () => {
  it('resolves offset, cursor, and none from schema configuration', () => {
    const source = {
      query: () => ({ queryKey: ['rows'], queryFn: async () => [{ id: 'row-1' }] }),
    }
    const offset = defineTableSchema({ tableKey: 'offset', rowKey: 'id', source })
    const cursor = defineTableSchema({
      tableKey: 'cursor',
      rowKey: 'id',
      source: {
        mode: 'remote',
        query: () => ({
          queryKey: ['cursor-rows'],
          queryFn: async () => ({
            rows: [{ id: 'row-1' }],
            pageInfo: {
              mode: 'cursor' as const,
              pageSize: 24,
              nextCursor: null,
              count: 'none' as const,
              rowCount: null,
            },
          }),
        }),
      },
      pagination: { mode: 'cursor', pageSize: 24 },
    })
    const none = defineTableSchema({
      tableKey: 'none',
      rowKey: 'id',
      source,
      pagination: false,
    })

    expect(getPaginationMode(offset)).toBe('offset')
    expect(getPaginationMode(cursor)).toBe('cursor')
    expect(getPaginationMode(none)).toBe('none')
  })

  it('flattens cursor pages, de-duplicates row keys, and preserves an exact total', () => {
    const result = flattenTableCursorPages({
      rowKey: 'id',
      pages: [
        {
          rows: [
            { id: 'row-1', label: 'First' },
            { id: 'row-2', label: 'Old' },
          ],
          pageInfo: {
            mode: 'cursor',
            pageSize: 2,
            nextCursor: 'page-2',
            count: 'exact',
            rowCount: 3,
          },
        },
        {
          rows: [
            { id: 'row-2', label: 'Updated' },
            { id: 'row-3', label: 'Third' },
          ],
          pageInfo: {
            mode: 'cursor',
            pageSize: 2,
            nextCursor: null,
            count: 'exact',
            rowCount: 3,
          },
        },
      ],
    })

    expect(result.rows).toEqual([
      { id: 'row-1', label: 'First' },
      { id: 'row-2', label: 'Updated' },
      { id: 'row-3', label: 'Third' },
    ])
    expect(result.rowCount).toBe(3)
  })

  it('keeps total count unknown when cursor counting is disabled', () => {
    const result = flattenTableCursorPages({
      rowKey: 'id',
      pages: [
        {
          rows: [{ id: 'row-1' }],
          pageInfo: {
            mode: 'cursor',
            pageSize: 1,
            nextCursor: null,
            count: 'none',
            rowCount: null,
          },
        },
      ],
    })

    expect(result.rows).toHaveLength(1)
    expect(result.rowCount).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'

import type { TableResolvedFilterGroup } from '#ui-tools/table/types'
import { filterClientRows } from '#ui-tools/table/utils/client-query'

const rows = [
  { id: 1, country: 'FR', score: 10, tags: ['a', 'b'], name: 'Alpha' },
  { id: 2, country: 'DE', score: 20, tags: ['b'], name: 'Beta' },
  { id: 3, country: 'ES', score: 30, tags: [], name: 'Gamma' },
]
const search = { value: '', fields: ['name'] as never[] }
const group = (key: string, operator: string, value: unknown): TableResolvedFilterGroup<string> =>
  ({ type: 'group', combinator: 'and', children: [{ type: 'condition', key, operator, value }] }) as TableResolvedFilterGroup<string>
const ids = (filters: TableResolvedFilterGroup<string>) => filterClientRows({ rows, filters, search }).map((row) => row.id)

describe('client filter operators', () => {
  it('matches isAnyOf and negates every listed value with isNot', () => {
    expect(ids(group('country', 'isAnyOf', ['FR', 'DE']))).toEqual([1, 2])
    expect(ids(group('country', 'isNot', ['FR', 'DE']))).toEqual([3])
    expect(ids(group('country', 'isNot', 'FR'))).toEqual([2, 3])
    expect(ids(group('country', 'is', 'DE'))).toEqual([2])
  })

  it('matches array fields and comparison operators', () => {
    expect(ids(group('tags', 'is', 'b'))).toEqual([1, 2])
    expect(ids(group('tags', 'isNot', ['a']))).toEqual([2, 3])
    expect(ids(group('score', 'gt', 10))).toEqual([2, 3])
    expect(ids(group('score', 'lte', 20))).toEqual([1, 2])
    expect(ids(group('score', 'between', { from: 15, to: 30 }))).toEqual([2, 3])
    expect(ids(group('name', 'contains', 'am'))).toEqual([3])
  })

  it('applies the search over configured fields', () => {
    expect(filterClientRows({ rows, filters: group('country', 'isAnyOf', ['FR', 'DE', 'ES']), search: { value: 'bet', fields: ['name'] as never[] } }).map((row) => row.id)).toEqual([2])
  })
})

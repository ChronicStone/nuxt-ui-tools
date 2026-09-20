import { describe, expect, it } from 'vitest'

import type { TableResolvedFilterGroup } from '#ui-tools/table/types'
import { filterClientRows } from '#ui-tools/table/utils/client-query'

const rows = [
  { country: 'FR', id: 1, name: 'Alpha', score: 10, tags: ['a', 'b'] },
  { country: 'DE', id: 2, name: 'Beta', score: 20, tags: ['b'] },
  { country: 'ES', id: 3, name: 'Gamma', score: 30, tags: [] },
]
const search = { fields: ['name'] as never[], value: '' }
function group(key: string, operator: string, value: unknown): TableResolvedFilterGroup<string> {
  return {
    children: [{ key, operator, type: 'condition', value }],
    combinator: 'and',
    type: 'group',
  } as TableResolvedFilterGroup<string>
}
function ids(filters: TableResolvedFilterGroup<string>) {
  return filterClientRows({ filters, rows, search }).map((row) => row.id)
}

describe('client filter operators', () => {
  it('matches isAnyOf and negates every listed value with isNot', () => {
    expect(ids(group('country', 'isAnyOf', ['FR', 'DE']))).toStrictEqual([1, 2])
    expect(ids(group('country', 'isNot', ['FR', 'DE']))).toStrictEqual([3])
    expect(ids(group('country', 'isNot', 'FR'))).toStrictEqual([2, 3])
    expect(ids(group('country', 'is', 'DE'))).toStrictEqual([2])
  })

  it('matches array fields and comparison operators', () => {
    expect([
      ids(group('tags', 'is', 'b')),
      ids(group('tags', 'isNot', ['a'])),
      ids(group('score', 'gt', 10)),
      ids(group('score', 'lte', 20)),
      ids(group('score', 'between', { from: 15, to: 30 })),
      ids(group('name', 'contains', 'am')),
    ]).toStrictEqual([[1, 2], [2, 3], [2, 3], [1, 2], [2, 3], [3]])
  })

  it('applies the search over configured fields', () => {
    expect(
      filterClientRows({
        filters: group('country', 'isAnyOf', ['FR', 'DE', 'ES']),
        rows,
        search: { fields: ['name'] as never[], value: 'bet' },
      }).map((row) => row.id),
    ).toStrictEqual([2])
  })
})
